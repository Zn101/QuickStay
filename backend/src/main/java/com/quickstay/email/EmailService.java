package com.quickstay.email;

import com.quickstay.booking.Booking;
import com.quickstay.booking.PaymentMethod;
import com.quickstay.booking.PaymentStatus;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Dich vu gui email giao dich (SMTP that neu cau hinh MAIL_HOST; nguoc lai luu hop thu mo phong trong email_logs).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final NumberFormat VND = NumberFormat.getInstance(new Locale("vi", "VN"));
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final EmailLogRepository logs;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String mailHost;
    private final String fromAddress;
    private final String frontendUrl;

    public EmailService(
            EmailLogRepository logs,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${app.mail.from:no-reply@quickstay.io.vn}") String fromAddress,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.logs = logs;
        this.mailSenderProvider = mailSenderProvider;
        this.mailHost = mailHost;
        this.fromAddress = fromAddress;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    public boolean smtpEnabled() {
        return mailHost != null && !mailHost.isBlank() && mailSenderProvider.getIfAvailable() != null;
    }

    public EmailLog send(String to, String subject, String bodyHtml, String emailType) {
        String safeBody = bodyHtml.length() > 7900 ? bodyHtml.substring(0, 7900) : bodyHtml;
        String status = "SENT_DEMO";

        if (smtpEnabled()) {
            try {
                JavaMailSender sender = mailSenderProvider.getIfAvailable();
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
                helper.setFrom(fromAddress);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(safeBody, true);
                sender.send(message);
                status = "SENT_SMTP";
                log.info("Da gui email SMTP toi {} [{}]", to, emailType);
            } catch (Exception e) {
                log.warn("Gui email SMTP toi {} that bai ({}), luu du phong vao email_logs", to, e.getMessage());
                status = "SENT_DEMO";
            }
        } else {
            log.info("[DEMO EMAIL] To: {} | Type: {} | Subject: {}", to, emailType, subject);
        }

        EmailLog entry = new EmailLog();
        entry.setRecipient(to);
        entry.setSubject(subject);
        entry.setBodyHtml(safeBody);
        entry.setEmailType(emailType);
        entry.setStatus(status);
        return logs.save(entry);
    }

    public EmailLog sendVerificationEmail(String to, String fullName, String token) {
        String link = frontendUrl + "/verify-email?token=" + escape(token);
        String name = escape(fullName == null || fullName.isBlank() ? "Quý khách" : fullName);
        String html = wrapTemplate(
                "Xác thực địa chỉ email của bạn",
                "<p>Xin chào <strong>" + name + "</strong>,</p>"
                + "<p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>QuickStay</strong>. Vui lòng nhấn nút bên dưới để xác thực email và kích hoạt đầy đủ tính năng bảo mật tài khoản:</p>"
                + ctaButton(link, "Xác thực Email Ngay", "#0284c7")
                + "<p style='font-size:13px;color:#64748b;'>Hoặc sử dụng mã xác thực: <code style='background:#f1f5f9;padding:3px 8px;border-radius:6px;font-weight:700;color:#0f172a;'>" + escape(token) + "</code></p>"
                + "<p style='font-size:12px;color:#94a3b8;'>Liên kết có hiệu lực trong vòng 24 giờ. Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email.</p>"
        );
        return send(to, "[QuickStay] Xác thực địa chỉ email tài khoản", html, "EMAIL_VERIFICATION");
    }

    public EmailLog sendPasswordResetEmail(String to, String fullName, String token) {
        String link = frontendUrl + "/reset-password?token=" + escape(token);
        String name = escape(fullName == null || fullName.isBlank() ? "Quý khách" : fullName);
        String html = wrapTemplate(
                "Yêu cầu đặt lại mật khẩu",
                "<p>Xin chào <strong>" + name + "</strong>,</p>"
                + "<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản QuickStay liên kết với email <strong>" + escape(to) + "</strong>.</p>"
                + ctaButton(link, "Đặt lại mật khẩu mới", "#0284c7")
                + "<p style='font-size:13px;color:#64748b;'>Hoặc nhập mã khôi phục: <code style='background:#f1f5f9;padding:3px 8px;border-radius:6px;font-weight:700;color:#0f172a;'>" + escape(token) + "</code></p>"
                + "<p style='font-size:12px;color:#94a3b8;'>Liên kết sẽ hết hạn sau <strong>15 phút</strong>. Nếu bạn không yêu cầu thay đổi mật khẩu, tài khoản của bạn vẫn an toàn và bạn có thể bỏ qua email này.</p>"
        );
        return send(to, "[QuickStay] Hướng dẫn đặt lại mật khẩu", html, "PASSWORD_RESET");
    }

    public EmailLog sendPasswordChangedEmail(String to, String fullName) {
        String name = escape(fullName == null || fullName.isBlank() ? "Quý khách" : fullName);
        String html = wrapTemplate(
                "Mật khẩu của bạn đã được cập nhật",
                "<p>Xin chào <strong>" + name + "</strong>,</p>"
                + "<p>Mật khẩu đăng nhập tài khoản QuickStay của bạn vừa được thay đổi thành công.</p>"
                + "<p style='font-size:13px;color:#64748b;'>Nếu bạn không thực hiện thao tác này, vui lòng liên hệ hỗ trợ ngay lập tức để bảo vệ tài khoản.</p>"
        );
        return send(to, "[QuickStay] Thông báo thay đổi mật khẩu", html, "PASSWORD_CHANGED");
    }

    public EmailLog sendBookingConfirmationEmail(Booking b) {
        String hotelName = escape(b.getRoom().getHotel().getName());
        String roomType = escape(b.getRoom().getRoomType());
        String guest = escape(b.getGuestName());
        String payLabel = paymentMethodLabel(b.getPaymentMethod());
        String payStatus = paymentStatusLabel(b.getPaymentStatus());
        String html = wrapTemplate(
                "Xác nhận đơn đặt phòng #" + b.getId(),
                "<p>Xin chào <strong>" + guest + "</strong>,</p>"
                + "<p>Đơn đặt phòng của bạn tại <strong>" + hotelName + "</strong> đã được hệ thống ghi nhận thành công.</p>"
                + infoTable(new String[][]{
                        {"Mã đơn đặt phòng", "#" + b.getId()},
                        {"Khách sạn", hotelName},
                        {"Loại phòng", roomType},
                        {"Nhận phòng", b.getCheckIn().toString()},
                        {"Trả phòng", b.getCheckOut().toString()},
                        {"Số khách", b.getGuests() + " khách"},
                        {"Tổng tiền", formatVnd(b.getTotalPrice())},
                        {"Phương thức", payLabel},
                        {"Thanh toán", payStatus}
                })
                + ctaButton(frontendUrl + "/my-bookings", "Xem chi tiết đơn đặt phòng", "#0284c7")
        );
        return send(b.getUser().getEmail(), "[QuickStay] Xác nhận đặt phòng #" + b.getId() + " - " + b.getRoom().getHotel().getName(), html, "BOOKING_CONFIRMATION");
    }

    public EmailLog sendPaymentReceiptEmail(Booking b) {
        String hotelName = escape(b.getRoom().getHotel().getName());
        String guest = escape(b.getGuestName());
        String paidTime = b.getPaidAt() != null ? TS_FMT.format(b.getPaidAt()) : "";
        String html = wrapTemplate(
                "Biên lai thanh toán thành công #" + b.getId(),
                "<p>Xin chào <strong>" + guest + "</strong>,</p>"
                + "<p>QuickStay xác nhận đã nhận được khoản thanh toán cho đơn đặt phòng <strong>#" + b.getId() + "</strong>.</p>"
                + infoTable(new String[][]{
                        {"Mã giao dịch", escape(b.getPaymentRef())},
                        {"Mã đơn đặt phòng", "#" + b.getId()},
                        {"Khách sạn", hotelName + " (" + escape(b.getRoom().getRoomType()) + ")"},
                        {"Hình thức thanh toán", paymentMethodLabel(b.getPaymentMethod())},
                        {"Số tiền đã thanh toán", formatVnd(b.getTotalPrice())},
                        {"Thời gian giao dịch", paidTime},
                        {"Trạng thái", "ĐÃ THANH TOÁN"}
                })
                + ctaButton(frontendUrl + "/my-bookings", "Xem biên lai trên QuickStay", "#059669")
        );
        return send(b.getUser().getEmail(), "[QuickStay] Biên lai thanh toán #" + b.getId() + " (" + b.getPaymentRef() + ")", html, "PAYMENT_RECEIPT");
    }

    public EmailLog sendBookingStatusEmail(Booking b) {
        String hotelName = escape(b.getRoom().getHotel().getName());
        String guest = escape(b.getGuestName());
        String refundNote = b.getPaymentStatus() == PaymentStatus.REFUNDED
                ? "<p style='background:#ecfdf5;border:1px solid #a7f3d0;padding:12px;border-radius:8px;color:#065f46;font-size:13px;'><strong>Hoàn tiền:</strong> Khoản thanh toán <strong>" + formatVnd(b.getTotalPrice()) + "</strong> (mã GD: " + escape(b.getPaymentRef()) + ") đã được khởi tạo hoàn trả về phương thức thanh toán ban đầu.</p>"
                : "";
        String html = wrapTemplate(
                "Cập nhật trạng thái đơn #" + b.getId() + ": " + b.getStatus(),
                "<p>Xin chào <strong>" + guest + "</strong>,</p>"
                + "<p>Trạng thái đơn đặt phòng <strong>#" + b.getId() + "</strong> tại <strong>" + hotelName + "</strong> vừa được cập nhật thành: <strong>" + b.getStatus() + "</strong>.</p>"
                + refundNote
                + ctaButton(frontendUrl + "/my-bookings", "Kiểm tra đơn đặt phòng", "#0284c7")
        );
        return send(b.getUser().getEmail(), "[QuickStay] Cập nhật đơn đặt phòng #" + b.getId() + " - " + b.getStatus(), html, "BOOKING_STATUS");
    }

    public EmailLog sendConciergeConfirmationEmail(String to, String guestName, String hotelName,
                                                   String serviceTypeLabel, String serviceTitle,
                                                   String serviceDate, String serviceTime, int guests,
                                                   BigDecimal estimatedFee, String details) {
        String html = wrapTemplate(
                "Xác nhận dịch vụ hỗ trợ: " + escape(serviceTypeLabel),
                "<p>Xin chào <strong>" + escape(guestName) + "</strong>,</p>"
                + "<p>Yêu cầu dịch vụ của bạn tại <strong>" + escape(hotelName) + "</strong> đã được tiếp nhận và xác nhận.</p>"
                + infoTable(new String[][]{
                        {"Loại dịch vụ", escape(serviceTypeLabel)},
                        {"Chi tiết dịch vụ", escape(serviceTitle)},
                        {"Ngày thực hiện", escape(serviceDate)},
                        {"Khung giờ", escape(serviceTime == null || serviceTime.isBlank() ? "Theo lịch trình" : serviceTime)},
                        {"Số khách", guests + " khách"},
                        {"Chi phí dự kiến", estimatedFee != null && estimatedFee.signum() > 0 ? formatVnd(estimatedFee) : "Miễn phí / Theo thực tế"},
                        {"Ghi chú", escape(details == null || details.isBlank() ? "Không có" : details)}
                })
                + ctaButton(frontendUrl + "/my-bookings", "Quản lý lịch trình trên QuickStay", "#0284c7")
        );
        return send(to, "[QuickStay] Xác nhận " + serviceTypeLabel + " - " + hotelName, html, "CONCIERGE_SERVICE");
    }

    private static String wrapTemplate(String heading, String content) {
        return "<div style='font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;'>"
                + "<div style='max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;'>"
                + "<div style='background:linear-gradient(135deg,#0284c7,#0f172a);padding:20px 24px;color:#ffffff;'>"
                + "<div style='font-size:18px;font-weight:800;letter-spacing:-0.5px;'>QuickStay</div>"
                + "<div style='font-size:13px;opacity:0.85;margin-top:4px;'>" + heading + "</div>"
                + "</div>"
                + "<div style='padding:24px;font-size:14px;line-height:1.6;'>" + content + "</div>"
                + "<div style='padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;'>"
                + "© QuickStay · Đặt phòng khách sạn trực tuyến · quickstay.io.vn"
                + "</div></div></div>";
    }

    private static String ctaButton(String url, String label, String color) {
        return "<div style='margin:20px 0;text-align:center;'>"
                + "<a href='" + url + "' style='display:inline-block;background:" + color + ";color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;'>"
                + label + "</a></div>";
    }

    private static String infoTable(String[][] rows) {
        StringBuilder sb = new StringBuilder("<table style='width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;background:#f8fafc;border-radius:10px;overflow:hidden;'>");
        for (String[] row : rows) {
            sb.append("<tr><td style='padding:8px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;'>").append(row[0])
              .append("</td><td style='padding:8px 12px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0;'>").append(row[1]).append("</td></tr>");
        }
        return sb.append("</table>").toString();
    }

    private static String formatVnd(BigDecimal amount) {
        return amount == null ? "0 ₫" : VND.format(amount) + " ₫";
    }

    private static String paymentMethodLabel(PaymentMethod m) {
        if (m == null) return "Thanh toán tại khách sạn";
        return switch (m) {
            case PAY_AT_HOTEL -> "Thanh toán tại khách sạn";
            case BANK_TRANSFER -> "Chuyển khoản VietQR";
            case CREDIT_CARD -> "Thẻ quốc tế (Visa/Mastercard)";
            case E_WALLET -> "Ví điện tử (MoMo/VNPay)";
        };
    }

    private static String paymentStatusLabel(PaymentStatus s) {
        if (s == null) return "Chưa thanh toán";
        return switch (s) {
            case UNPAID -> "Chưa thanh toán";
            case PAID -> "Đã thanh toán";
            case REFUNDED -> "Đã hoàn tiền";
        };
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
