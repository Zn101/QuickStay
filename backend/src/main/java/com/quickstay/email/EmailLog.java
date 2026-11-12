package com.quickstay.email;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "email_logs")
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipient;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 8000)
    private String bodyHtml;

    @Column(nullable = false, length = 40)
    private String emailType;

    @Column(nullable = false, length = 20)
    private String status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant sentAt;

    public Long getId() { return id; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBodyHtml() { return bodyHtml; }
    public void setBodyHtml(String bodyHtml) { this.bodyHtml = bodyHtml; }
    public String getEmailType() { return emailType; }
    public void setEmailType(String emailType) { this.emailType = emailType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getSentAt() { return sentAt; }
}
