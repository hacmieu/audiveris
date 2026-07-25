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
import org.audiveris.omr.step.RunClass;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.IOException;
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
 * Headless read-only HTTP API over a loaded {@link Book} (Phase 2 of the GUI→web port).
 * <p>
 * Launch via CLI {@code -run}:
 * <pre>
 * ./gradlew :app:run --no-daemon \
 *   -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,/ABS/path/book.omr"
 * </pre>
 * Optional {@code -Domr.api.port=8080}. Endpoints:
 * <ul>
 *   <li>{@code GET /api/book}</li>
 *   <li>{@code GET /api/sheet/{n}/data} — same schema as {@code tools/omr_extract.py}</li>
 *   <li>{@code GET /api/sheet/{n}/inters}</li>
 *   <li>{@code GET /api/sheet/{n}/relations}</li>
 *   <li>{@code GET /api/sheet/{n}/image} — BINARY PNG</li>
 *   <li>{@code GET /api/health}</li>
 * </ul>
 */
public class OmrApiServer
        extends RunClass
{
    private static final Logger logger = LoggerFactory.getLogger(OmrApiServer.class);

    private static final int DEFAULT_PORT = 8080;

    public OmrApiServer (Book book,
                         SortedSet<Integer> sheetIds)
    {
        super(book, sheetIds);
    }

    @Override
    public void process ()
    {
        // Force every stub into memory so SIG + BINARY are available.
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
            server.createContext("/api/book", this::bookMeta);
            server.createContext("/api/sheet", this::sheet);
            server.setExecutor(Executors.newCachedThreadPool());
            server.start();
            logger.info("OmrApiServer listening on http://127.0.0.1:{}/api/  (Ctrl+C to stop)", port);
            // Keep the Audiveris process alive — otherwise -run exits and kills the server.
            Thread.currentThread().join();
        } catch (IOException | InterruptedException ex) {
            throw new RuntimeException("OmrApiServer failed: " + ex, ex);
        }
    }

    private void health (HttpExchange ex)
            throws IOException
    {
        writeJson(ex, 200, "{\"ok\":true}");
    }

    private void bookMeta (HttpExchange ex)
            throws IOException
    {
        if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
            writeJson(ex, 405, "{\"error\":\"method not allowed\"}");
            return;
        }
        final StringBuilder sb = new StringBuilder(256);
        sb.append("{\"book\":").append(jsonString(bookName()));
        sb.append(",\"path\":").append(jsonString(String.valueOf(book.getBookPath())));
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
        writeJson(ex, 200, sb.toString());
    }

    private void sheet (HttpExchange ex)
            throws IOException
    {
        if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
            writeJson(ex, 405, "{\"error\":\"method not allowed\"}");
            return;
        }
        // /api/sheet/{n}/data|inters|relations|image
        final String path = ex.getRequestURI().getPath();
        final String rest = path.substring("/api/sheet".length()); // /1/data
        final String[] parts = rest.split("/");
        if (parts.length < 3 || parts[1].isEmpty()) {
            writeJson(ex, 404, "{\"error\":\"use /api/sheet/{n}/data|inters|relations|image\"}");
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

        switch (action) {
            case "image" -> writePng(ex, sheet);
            case "data" -> writeJson(ex, 200, buildSheetJson(sheet, true, true));
            case "inters" -> writeJson(ex, 200, buildIntersArray(sheet));
            case "relations" -> writeJson(ex, 200, buildRelationsArray(sheet));
            default -> writeJson(ex, 404, "{\"error\":\"unknown action\"}");
        }
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

    private String buildSheetJson (Sheet sheet,
                                   boolean withInters,
                                   boolean withRelations)
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
        if (withInters) {
            sb.append("\"inters\":").append(buildIntersArray(sheet)).append(',');
        }
        if (withRelations) {
            sb.append("\"relations\":").append(buildRelationsArray(sheet));
        } else if (sb.charAt(sb.length() - 1) == ',') {
            sb.setLength(sb.length() - 1);
        }
        sb.append('}');
        return sb.toString();
    }

    private static String buildIntersArray (Sheet sheet)
    {
        final List<Inter> all = new ArrayList<>();
        for (SystemInfo system : sheet.getSystems()) {
            all.addAll(system.getSig().vertexSet());
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
                if ((source == null) || (target == null)) {
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
        // Fallback: HeadInter → head, Containment → containment
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
        h.set("Access-Control-Allow-Methods", "GET, OPTIONS");
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
