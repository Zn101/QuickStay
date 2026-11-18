package com.quickstay.email;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class EmailController {

    public record EmailLogView(Long id, String recipient, String subject, String bodyHtml,
                               String emailType, String status, Instant sentAt) {
        public static EmailLogView of(EmailLog e) {
            return new EmailLogView(e.getId(), e.getRecipient(), e.getSubject(),
                    e.getBodyHtml(), e.getEmailType(), e.getStatus(), e.getSentAt());
        }
    }

    private final EmailLogRepository logs;

    public EmailController(EmailLogRepository logs) {
        this.logs = logs;
    }

    /** Hop thu cua nguoi dung dang dang nhap (de xem email trong che do mo phong hoac kiem tra lich su email). */
    @GetMapping("/emails/me")
    public List<EmailLogView> myEmails(Authentication auth) {
        return logs.findTop30ByRecipientOrderBySentAtDescIdDesc(auth.getName())
                .stream().map(EmailLogView::of).toList();
    }

    /** Admin xem toan bo nhat ky email da gui tren he thong. */
    @GetMapping("/admin/emails")
    public List<EmailLogView> adminEmails() {
        return logs.findTop50ByOrderBySentAtDescIdDesc()
                .stream().map(EmailLogView::of).toList();
    }
}
