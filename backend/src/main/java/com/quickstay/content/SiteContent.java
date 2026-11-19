package com.quickstay.content;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/** Noi dung trang Tours / Restaurants / News: mot dong cho moi loai, du lieu la mang JSON. */
@Entity
@Table(name = "site_contents")
public class SiteContent {

    @Id
    @Column(name = "content_type", length = 40)
    private String contentType;

    @Column(name = "data_json", nullable = false, columnDefinition = "LONGTEXT")
    private String dataJson;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }
    public Instant getUpdatedAt() { return updatedAt; }
}
