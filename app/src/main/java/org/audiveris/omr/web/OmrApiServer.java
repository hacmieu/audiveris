//------------------------------------------------------------------------------------------------//
//                                                                                                //
//                                      O m r A p i S e r v e r                                   //
//                                                                                                //
//------------------------------------------------------------------------------------------------//
package org.audiveris.omr.web;

import org.audiveris.omr.sheet.Book;
import org.audiveris.omr.sheet.Picture;
import org.audiveris.omr.sheet.Sheet;
import org.audiveris.omr.sheet.SheetStub;
import org.audiveris.omr.sheet.Staff;
import org.audiveris.omr.sheet.SystemInfo;
import org.audiveris.omr.sig.SIGraph;
import org.audiveris.omr.sig.inter.Inter;
import org.audiveris.omr.sig.inter.SentenceInter;
import org.audiveris.omr.sig.inter.WordInter;
import org.audiveris.omr.sig.relation.Relation;
import org.audiveris.omr.sig.ui.RemovalTask;
import org.audiveris.omr.sig.ui.SentenceRoleTask;
import org.audiveris.omr.sig.ui.UITask;
import org.audiveris.omr.step.RunClass;
import org.audiveris.omr.text.TextRole;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.SortedSet;
import java.util.concurrent.Executors;

import javax.imageio.ImageIO;
import javax.xml.bind.annotation.XmlRootElement;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/**
 * Headless HTTP API over a loaded {@link Book} (Phases 2–3 of the GUI→web port).
 * <p>
 * Launch:
 * <pre>
 * ./gradlew :app:run --no-daemon \
 *   -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,/ABS/path/book.omr"
 * </pre>
 * Optional {@code -Domr.api.port=8080}.
 * <p>
 * Read: {@code GET /api/health|/book|/sheet/{n}/data|inters|relations|image}<br>
 * Write (P3): {@code DELETE /api/sheet/{n}/inter/{id}},
 * {@code POST /api/sheet/{n}/inter/{id}/role} body {@code {"role":"Lyrics"}},
 * {@code POST /api/book/save|undo|redo}
 */
public class OmrApiServer
        extends RunClass
{
    private static final Logger logger = LoggerFactory.getLogger(OmrApiServer.class);

    private static final int DEFAULT_PORT = 8080;

    /** Undo stack of performed tasks (cursor points at last done). */
    private final List<UITask> history = new ArrayList<>();

    private int historyCursor = -1;

    /** Serialize all mutations — SIG is not thread-safe. */
    private final Object editLock = new Object();

    public OmrApiServer (Book book,
                         SortedSet<Integer> sheetIds)
    {
        super(book, sheetIds);
    }

    @Override
    public void process ()
    {
        for (SheetStub stub : book.getStubs()) {
            if ((sheetIds != null) && !sheetIds.isEmpty() && !sheetIds.contains(stub.getNumber())) {
                continue;
            }
            logger.info("Loading sheet#{} …", stub.getNumber());
            stub.getSheet();
        }

        final int port = Integer.getInteger("omr.api.port", DEFAULT_PORT);
        try {
            final HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/api/health", this::health);
            server.createContext("/api/book", this::bookRoutes);
            server.createContext("/api/sheet", this::sheetRoutes);
            server.setExecutor(Executors.newCachedThreadPool());
            server.start();
            logger.info("OmrApiServer listening on http://127.0.0.1:{}/api/  (Ctrl+C to stop)", port);
            Thread.currentThread().join();
        } catch (IOException | InterruptedException ex) {
            throw new RuntimeException("OmrApiServer failed: " + ex, ex);
        }
    }

    //~ HTTP handlers ------------------------------------------------------------------------------

    private void health (HttpExchange ex)
            throws IOException
    {
        if (preflight(ex)) {
            return;
        }
        writeJson(ex, 200, "{\"ok\":true,\"canUndo\":" + canUndo() + ",\"canRedo\":" + canRedo()
                + ",\"dirty\":" + book.isModified() + "}");
    }

    private void bookRoutes (HttpExchange ex)
            throws IOException
    {
        if (preflight(ex)) {
            return;
        }
        final String path = ex.getRequestURI().getPath(); // /api/book or /api/book/save
        final String method = ex.getRequestMethod().toUpperCase(Locale.ROOT);

        if ("/api/book".equals(path) && "GET".equals(method)) {
            writeJson(ex, 200, bookMetaJson());
            return;
        }
        if (!"POST".equals(method)) {
            writeJson(ex, 405, "{\"error\":\"method not allowed\"}");
            return;
        }

        try {
            synchronized (editLock) {
                switch (path) {
                    case "/api/book/save" -> {
                        book.store();
                        writeJson(ex, 200, "{\"ok\":true,\"saved\":" + jsonString(
                                String.valueOf(book.getBookPath())) + "}");
                    }
                    case "/api/book/undo" -> {
                        if (!canUndo()) {
                            writeJson(ex, 409, "{\"error\":\"nothing to undo\"}");
                            return;
                        }
                        final UITask task = history.get(historyCursor);
                        task.performUndo();
                        historyCursor--;
                        writeJson(ex, 200, statusJson("undone", task.toString()));
                    }
                    case "/api/book/redo" -> {
                        if (!canRedo()) {
                            writeJson(ex, 409, "{\"error\":\"nothing to redo\"}");
                            return;
                        }
                        final UITask task = history.get(historyCursor + 1);
                        task.performDo();
                        historyCursor++;
                        writeJson(ex, 200, statusJson("redone", task.toString()));
                    }
                    default -> writeJson(ex, 404, "{\"error\":\"unknown book action\"}");
                }
            }
        } catch (Exception err) {
            logger.warn("book route failed: {}", err.toString(), err);
            writeJson(ex, 500, "{\"error\":" + jsonString(err.toString()) + "}");
        }
    }

    private void sheetRoutes (HttpExchange ex)
            throws IOException
    {
        if (preflight(ex)) {
            return;
        }
        final String method = ex.getRequestMethod().toUpperCase(Locale.ROOT);
        final String path = ex.getRequestURI().getPath();
        final String rest = path.substring("/api/sheet".length()); // /1/data or /1/inter/1269
        final String[] parts = rest.split("/");
        // parts[0]=="" , parts[1]=n , parts[2]=action…
        if (parts.length < 3 || parts[1].isEmpty()) {
            writeJson(ex, 404, "{\"error\":\"use /api/sheet/{n}/…\"}");
            return;
        }
        final int number;
        try {
            number = Integer.parseInt(parts[1]);
        } catch (NumberFormatException nfe) {
            writeJson(ex, 400, "{\"error\":\"bad sheet number\"}");
            return;
        }
        final SheetStub stub = book.getStub(number);
        if (stub == null) {
            writeJson(ex, 404, "{\"error\":\"sheet not found\"}");
            return;
        }
        final Sheet sheet = stub.getSheet();
        final String action = parts[2];

        try {
            if ("GET".equals(method)) {
                switch (action) {
                    case "image" -> {
                        writePng(ex, sheet);
                        return;
                    }
                    case "data" -> {
                        writeJson(ex, 200, buildSheetJson(sheet));
                        return;
                    }
                    case "inters" -> {
                        writeJson(ex, 200, buildIntersArray(sheet));
                        return;
                    }
                    case "relations" -> {
                        writeJson(ex, 200, buildRelationsArray(sheet));
                        return;
                    }
                    default -> {
                        writeJson(ex, 404, "{\"error\":\"unknown GET action\"}");
                        return;
                    }
                }
            }

            // Mutations: /inter/{id} or /inter/{id}/role
            if (!"inter".equals(action) || parts.length < 4) {
                writeJson(ex, 405, "{\"error\":\"method not allowed\"}");
                return;
            }
            final int interId = Integer.parseInt(parts[3]);

            synchronized (editLock) {
                final Inter inter = findInter(sheet, interId);
                if (inter == null) {
                    writeJson(ex, 404, "{\"error\":\"inter not found\",\"id\":" + interId + "}");
                    return;
                }

                if ("DELETE".equals(method) && parts.length == 4) {
                    final RemovalTask task = new RemovalTask(inter);
                    runTask(task, stub);
                    writeJson(ex, 200, statusJson("removed", "inter#" + interId));
                    return;
                }

                if ("POST".equals(method) && parts.length == 5 && "role".equals(parts[4])) {
                    if (!(inter instanceof SentenceInter sentence)) {
                        writeJson(ex, 400, "{\"error\":\"inter is not a sentence\"}");
                        return;
                    }
                    final String body = readBody(ex);
                    final String roleName = extractJsonString(body, "role");
                    if (roleName == null || roleName.isBlank()) {
                        writeJson(ex, 400, "{\"error\":\"body must be {\\\"role\\\":\\\"Lyrics\\\"}\"}");
                        return;
                    }
                    final TextRole newRole;
                    try {
                        newRole = TextRole.valueOf(roleName);
                    } catch (IllegalArgumentException iae) {
                        writeJson(ex, 400, "{\"error\":\"unknown TextRole\",\"role\":"
                                + jsonString(roleName) + "}");
                        return;
                    }
                    if (sentence.getRole() == newRole) {
                        writeJson(ex, 200, statusJson("unchanged", roleName));
                        return;
                    }
                    final SentenceRoleTask task = new SentenceRoleTask(sentence, newRole);
                    runTask(task, stub);
                    writeJson(ex, 200, statusJson("role-changed",
                            "inter#" + interId + " → " + newRole));
                    return;
                }
            }

            writeJson(ex, 404, "{\"error\":\"unknown mutation\"}");
        } catch (NumberFormatException nfe) {
            writeJson(ex, 400, "{\"error\":\"bad id\"}");
        } catch (Exception err) {
            logger.warn("sheet route failed: {}", err.toString(), err);
            writeJson(ex, 500, "{\"error\":" + jsonString(err.toString()) + "}");
        }
    }

    //~ Edit helpers -------------------------------------------------------------------------------

    private void runTask (UITask task,
                          SheetStub stub)
    {
        task.performDo();
        // Drop redo tail
        while (history.size() > historyCursor + 1) {
            history.remove(history.size() - 1);
        }
        history.add(task);
        historyCursor = history.size() - 1;
        stub.setModified(true);
        book.setDirty(true);
        logger.info("edit: {}", task);
    }

    private boolean canUndo ()
    {
        return historyCursor >= 0;
    }

    private boolean canRedo ()
    {
        return historyCursor < history.size() - 1;
    }

    private static Inter findInter (Sheet sheet,
                                    int id)
    {
        for (SystemInfo system : sheet.getSystems()) {
            for (Inter inter : system.getSig().vertexSet()) {
                if (inter.getId() == id && !inter.isRemoved()) {
                    return inter;
                }
            }
        }
        return null;
    }

    //~ JSON builders ------------------------------------------------------------------------------

    private String bookMetaJson ()
    {
        final StringBuilder sb = new StringBuilder(256);
        sb.append("{\"book\":").append(jsonString(bookName()));
        sb.append(",\"path\":").append(jsonString(String.valueOf(book.getBookPath())));
        sb.append(",\"dirty\":").append(book.isModified() || book.isDirty());
        sb.append(",\"canUndo\":").append(canUndo());
        sb.append(",\"canRedo\":").append(canRedo());
        sb.append(",\"sheets\":[");
        boolean first = true;
        for (SheetStub stub : book.getStubs()) {
            if (!first) {
                sb.append(',');
            }
            first = false;
            sb.append("{\"sheet\":").append(stub.getNumber()).append('}');
        }
        sb.append("]}");
        return sb.toString();
    }

    private String statusJson (String action,
                               String detail)
    {
        return "{\"ok\":true,\"action\":" + jsonString(action)
                + ",\"detail\":" + jsonString(detail)
                + ",\"canUndo\":" + canUndo()
                + ",\"canRedo\":" + canRedo()
                + ",\"dirty\":" + (book.isModified() || book.isDirty()) + "}";
    }

    private String buildSheetJson (Sheet sheet)
    {
        final BufferedImage img = binaryImage(sheet);
        final int width = img != null ? img.getWidth() : 0;
        final int height = img != null ? img.getHeight() : 0;
        final StringBuilder sb = new StringBuilder(64_000);
        sb.append('{');
        sb.append("\"book\":").append(jsonString(bookName())).append(',');
        sb.append("\"sheet\":").append(sheet.getStub().getNumber()).append(',');
        sb.append("\"image\":").append(jsonString("sheet-" + sheet.getStub().getNumber() + ".png"))
                .append(',');
        sb.append("\"width\":").append(width).append(',');
        sb.append("\"height\":").append(height).append(',');
        sb.append("\"inters\":").append(buildIntersArray(sheet)).append(',');
        sb.append("\"relations\":").append(buildRelationsArray(sheet));
        sb.append('}');
        return sb.toString();
    }

    private static String buildIntersArray (Sheet sheet)
    {
        final List<Inter> all = new ArrayList<>();
        for (SystemInfo system : sheet.getSystems()) {
            for (Inter inter : system.getSig().vertexSet()) {
                if (!inter.isRemoved()) {
                    all.add(inter);
                }
            }
        }
        all.sort(Comparator.comparingInt(Inter::getId));

        final StringBuilder sb = new StringBuilder(all.size() * 120);
        sb.append('[');
        boolean first = true;
        for (Inter inter : all) {
            final Rectangle bounds = inter.getBounds();
            if (bounds == null) {
                continue;
            }
            if (!first) {
                sb.append(',');
            }
            first = false;
            final Staff staff = inter.getStaff();
            final Double grade = inter.getGrade();
            final Double ctx = inter.getContextualGrade();
            final int systemId = inter.getSig() != null && inter.getSig().getSystem() != null
                    ? inter.getSig().getSystem().getId()
                    : 0;
            sb.append('{');
            sb.append("\"id\":").append(inter.getId()).append(',');
            sb.append("\"type\":").append(jsonString(xmlName(inter.getClass()))).append(',');
            sb.append("\"shape\":").append(
                    inter.getShape() != null ? jsonString(inter.getShape().name()) : "null").append(
                            ',');
            sb.append("\"grade\":").append(grade != null ? format(grade) : "null").append(',');
            sb.append("\"ctxGrade\":").append(ctx != null ? format(ctx) : "null").append(',');
            sb.append("\"staff\":").append(staff != null ? staff.getId() : "null").append(',');
            sb.append("\"system\":").append(systemId).append(',');
            sb.append("\"role\":").append(jsonString(roleOf(inter))).append(',');
            sb.append("\"value\":").append(jsonString(valueOf(inter))).append(',');
            sb.append("\"x\":").append(bounds.x).append(',');
            sb.append("\"y\":").append(bounds.y).append(',');
            sb.append("\"w\":").append(bounds.width).append(',');
            sb.append("\"h\":").append(bounds.height);
            sb.append('}');
        }
        sb.append(']');
        return sb.toString();
    }

    private static String buildRelationsArray (Sheet sheet)
    {
        final StringBuilder sb = new StringBuilder(32_000);
        sb.append('[');
        boolean first = true;
        for (SystemInfo system : sheet.getSystems()) {
            final SIGraph sig = system.getSig();
            for (Relation rel : sig.edgeSet()) {
                final Inter source = sig.getEdgeSource(rel);
                final Inter target = sig.getEdgeTarget(rel);
                if ((source == null) || (target == null) || source.isRemoved() || target
                        .isRemoved()) {
                    continue;
                }
                if (!first) {
                    sb.append(',');
                }
                first = false;
                sb.append('{');
                sb.append("\"source\":").append(source.getId()).append(',');
                sb.append("\"target\":").append(target.getId()).append(',');
                sb.append("\"type\":").append(jsonString(xmlName(rel.getClass())));
                sb.append('}');
            }
        }
        sb.append(']');
        return sb.toString();
    }

    private static String roleOf (Inter inter)
    {
        if (inter instanceof SentenceInter sentence && sentence.getRole() != null) {
            return sentence.getRole().name();
        }
        return null;
    }

    private static String valueOf (Inter inter)
    {
        if (inter instanceof WordInter word) {
            return word.getValue();
        }
        if (inter instanceof SentenceInter sentence) {
            return sentence.getValue();
        }
        return null;
    }

    private static String xmlName (Class<?> cls)
    {
        final XmlRootElement root = cls.getAnnotation(XmlRootElement.class);
        if (root != null && !root.name().isEmpty() && !root.name().equals("##default")) {
            return root.name();
        }
        String name = cls.getSimpleName();
        name = name.replaceFirst("Inter$", "").replaceFirst("Relation$", "");
        return name.replaceAll("([a-z])([A-Z])", "$1-$2").toLowerCase(Locale.ROOT);
    }

    private String bookName ()
    {
        if (book.getBookPath() != null) {
            final String file = book.getBookPath().getFileName().toString();
            final int dot = file.lastIndexOf('.');
            return dot > 0 ? file.substring(0, dot) : file;
        }
        return "book";
    }

    //~ IO helpers ---------------------------------------------------------------------------------

    private static BufferedImage binaryImage (Sheet sheet)
    {
        if (!sheet.hasPicture()) {
            return null;
        }
        final Picture picture = sheet.getPicture();
        BufferedImage img = picture.getImage(Picture.ImageKey.BINARY);
        if (img == null) {
            img = picture.getSource(Picture.SourceKey.BINARY).getBufferedImage();
        }
        return img;
    }

    private void writePng (HttpExchange ex,
                           Sheet sheet)
            throws IOException
    {
        final BufferedImage img = binaryImage(sheet);
        if (img == null) {
            writeJson(ex, 404, "{\"error\":\"no BINARY image\"}");
            return;
        }
        final Headers h = ex.getResponseHeaders();
        h.set("Content-Type", "image/png");
        cors(h);
        ex.sendResponseHeaders(200, 0);
        try (OutputStream os = ex.getResponseBody()) {
            ImageIO.write(img, "png", os);
        }
    }

    private static boolean preflight (HttpExchange ex)
            throws IOException
    {
        if (!"OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
            return false;
        }
        final Headers h = ex.getResponseHeaders();
        cors(h);
        ex.sendResponseHeaders(204, -1);
        ex.close();
        return true;
    }

    private static String readBody (HttpExchange ex)
            throws IOException
    {
        try (InputStream in = ex.getRequestBody()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /** Tiny extractor — enough for {"role":"Lyrics"}. */
    private static String extractJsonString (String json,
                                             String key)
    {
        if (json == null) {
            return null;
        }
        final String needle = "\"" + key + "\"";
        final int k = json.indexOf(needle);
        if (k < 0) {
            return null;
        }
        final int colon = json.indexOf(':', k + needle.length());
        if (colon < 0) {
            return null;
        }
        final int q1 = json.indexOf('"', colon + 1);
        if (q1 < 0) {
            return null;
        }
        final int q2 = json.indexOf('"', q1 + 1);
        if (q2 < 0) {
            return null;
        }
        return json.substring(q1 + 1, q2);
    }

    private static String format (double v)
    {
        return String.format(Locale.ROOT, "%.6g", v);
    }

    private static String jsonString (String s)
    {
        if (s == null) {
            return "null";
        }
        final StringBuilder sb = new StringBuilder(s.length() + 8);
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            final char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format(Locale.ROOT, "\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
        return sb.toString();
    }

    private static void cors (Headers h)
    {
        h.set("Access-Control-Allow-Origin", "*");
        h.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        h.set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void writeJson (HttpExchange ex,
                                   int status,
                                   String body)
            throws IOException
    {
        final byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        final Headers h = ex.getResponseHeaders();
        h.set("Content-Type", "application/json; charset=utf-8");
        cors(h);
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
