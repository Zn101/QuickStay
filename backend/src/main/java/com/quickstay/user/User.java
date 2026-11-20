package com.quickstay.user;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Luon luu chu thuong, da trim. */
    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String fullName;
    private String phone;

    // VARCHAR thay vi kieu ENUM cua MySQL: them vai tro moi khong can ALTER kieu cot
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Role role = Role.CUSTOMER;

    @Column(name = "hotel_id")
    private Long hotelId;

    /** Thoi diem dong y Dieu khoan & Chinh sach khi dang ky. */
    @Column(name = "terms_accepted_at")
    private java.time.Instant termsAcceptedAt;

    @Column(name = "terms_version", length = 20)
    private String termsVersion;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column(length = 128)
    private String verificationToken;

    private Instant verificationTokenExpiresAt;

    @Column(length = 128)
    private String resetToken;

    private Instant resetTokenExpiresAt;

    /** JWT co iat truoc moc nay bi tu choi (dat khi doi / dat lai mat khau de dang xuat moi phien cu). */
    private Instant tokensValidAfter;

    @Column(nullable = false, length = 10)
    private String preferredLanguage = "vi";

    @Column(nullable = false, length = 10)
    private String currencyDisplay = "VND";

    @Column(nullable = false)
    private boolean notifyEmail = true;

    @Column(nullable = false)
    private boolean notifyPromo = false;

    @Column(nullable = false)
    private boolean compactMode = false;

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    public Instant getVerificationTokenExpiresAt() { return verificationTokenExpiresAt; }
    public void setVerificationTokenExpiresAt(Instant verificationTokenExpiresAt) { this.verificationTokenExpiresAt = verificationTokenExpiresAt; }
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public Instant getResetTokenExpiresAt() { return resetTokenExpiresAt; }
    public void setResetTokenExpiresAt(Instant resetTokenExpiresAt) { this.resetTokenExpiresAt = resetTokenExpiresAt; }
    public Instant getTokensValidAfter() { return tokensValidAfter; }
    public void setTokensValidAfter(Instant tokensValidAfter) { this.tokensValidAfter = tokensValidAfter; }
    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    public String getCurrencyDisplay() { return currencyDisplay; }
    public void setCurrencyDisplay(String currencyDisplay) { this.currencyDisplay = currencyDisplay; }
    public boolean isNotifyEmail() { return notifyEmail; }
    public void setNotifyEmail(boolean notifyEmail) { this.notifyEmail = notifyEmail; }
    public boolean isNotifyPromo() { return notifyPromo; }
    public void setNotifyPromo(boolean notifyPromo) { this.notifyPromo = notifyPromo; }
    public boolean isCompactMode() { return compactMode; }
    public void setCompactMode(boolean compactMode) { this.compactMode = compactMode; }

    public java.time.Instant getTermsAcceptedAt() { return termsAcceptedAt; }
    public void setTermsAcceptedAt(java.time.Instant termsAcceptedAt) { this.termsAcceptedAt = termsAcceptedAt; }
    public String getTermsVersion() { return termsVersion; }
    public void setTermsVersion(String termsVersion) { this.termsVersion = termsVersion; }
}
