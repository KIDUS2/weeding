package com.kidus.wedding.media;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "media")
public class Media {

    public enum Kind { PHOTO, MUSIC }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Kind kind;

    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    @Column(name = "original_name")
    private String originalName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    private String caption;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_cover", nullable = false)
    private boolean cover;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Kind getKind() { return kind; }
    public void setKind(Kind kind) { this.kind = kind; }
    public String getStoredName() { return storedName; }
    public void setStoredName(String storedName) { this.storedName = storedName; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public boolean isCover() { return cover; }
    public void setCover(boolean cover) { this.cover = cover; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
