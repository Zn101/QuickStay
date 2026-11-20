package com.quickstay.hotel;

import com.quickstay.config.ApiException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Doc / kiem tra noi dung nhieu dong do doi tac nhap (moi dong mot muc, cac cot cach nhau dau "|").
 * Dung chung cho thu vien anh, quy dinh, dua don, am thuc, diem tham quan va anh loai phong.
 */
public final class ContentLines {

    private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

    private ContentLines() {}

    /** Cac dong khong rong, da cat khoang trang. */
    public static List<String> lines(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return Arrays.stream(text.split("\\r?\\n")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** Tach mot dong thanh dung {@code columns} cot (thieu thi them chuoi rong, thua thi gop vao cot cuoi). */
    public static String[] cells(String line, int columns) {
        String[] raw = line.split("\\|", columns);
        String[] out = new String[columns];
        for (int i = 0; i < columns; i++) {
            out[i] = i < raw.length ? raw[i].trim() : "";
        }
        return out;
    }

    /** Gia VND trong mot o; o rong hoac "0" la mien phi. */
    public static BigDecimal price(String cell) {
        String digits = cell == null ? "" : cell.replaceAll("[.,\\s₫đ]|VND|vnd", "");
        if (digits.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(digits);
    }

    public static boolean isUrl(String s) {
        return s != null && (s.startsWith("https://") || s.startsWith("http://") || s.startsWith("/"));
    }

    /** null giu nguyen (khong gui truong do); chuoi rong nghia la xoa. */
    public static String normalize(String text) {
        if (text == null) {
            return null;
        }
        String joined = String.join("\n", lines(text));
        return joined;
    }

    public static void requireTime(String value, String label) {
        if (value != null && !value.isBlank() && !TIME.matcher(value.trim()).matches()) {
            throw ApiException.badRequest(label + " phai co dang HH:mm (vi du 14:00)");
        }
    }

    /** Moi dong bat dau bang URL anh hop le. */
    public static void requireImageLines(String text, String label) {
        int n = 0;
        for (String line : lines(text)) {
            n++;
            if (!isUrl(cells(line, 2)[0])) {
                throw ApiException.badRequest(label + ": dong " + n + " phai bat dau bang duong dan anh http(s)");
            }
        }
    }

    /** Moi dong co cot ten khong rong; neu {@code priceColumn} >= 0 thi cot do phai la so tien hop le. */
    public static void requireRows(String text, int columns, int priceColumn, String label) {
        int n = 0;
        for (String line : lines(text)) {
            n++;
            String[] c = cells(line, columns);
            if (c[0].isEmpty()) {
                throw ApiException.badRequest(label + ": dong " + n + " thieu ten");
            }
            if (priceColumn >= 0) {
                try {
                    if (price(c[priceColumn]).signum() < 0) {
                        throw new NumberFormatException();
                    }
                } catch (NumberFormatException e) {
                    throw ApiException.badRequest(label + ": dong " + n + " co gia khong hop le (chi nhap so, vi du 250000)");
                }
            }
        }
    }

    /** Danh sach cach nhau dau phay. */
    public static List<String> csv(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (String s : text.split(",")) {
            if (!s.isBlank()) out.add(s.trim());
        }
        return out;
    }
}
