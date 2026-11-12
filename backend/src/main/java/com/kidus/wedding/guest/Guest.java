package com.kidus.wedding.guest;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * One invitation. An invitation can admit several people ({@link #seats}),
 * e.g. "Ato Abebe & family" with 4 seats. People may arrive in groups,
 * so check-in is tracked as a running count.
 */
@Entity
@Table(name = "guest")
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Side side = Side.BOTH;

    @Column(name = "table_name")
    private String tableName;

    @Column(nullable = false)
    private int seats = 1;

    @Column(name = "invite_code", nullable = false, unique = true)
    private String inviteCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "rsvp_status", nullable = false)
    private RsvpStatus rsvpStatus = RsvpStatus.PENDING;

    @Column(name = "rsvp_count", nullable = false)
    private int rsvpCount;

    @Column(name = "rsvp_note")
    private String rsvpNote;

    @Column(name = "rsvp_at")
    private LocalDateTime rsvpAt;

    @Column(name = "checked_in_count", nullable = false)
    private int checkedInCount;

    @Column(name = "first_checked_in_at")
    private LocalDateTime firstCheckedInAt;

    @Column(name = "last_checked_in_at")
    private LocalDateTime lastCheckedInAt;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public int remainingSeats() {
        return Math.max(0, seats - checkedInCount);
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Side getSide() { return side; }
    public void setSide(Side side) { this.side = side; }
    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }
    public int getSeats() { return seats; }
    public void setSeats(int seats) { this.seats = seats; }
    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public RsvpStatus getRsvpStatus() { return rsvpStatus; }
    public void setRsvpStatus(RsvpStatus rsvpStatus) { this.rsvpStatus = rsvpStatus; }
    public int getRsvpCount() { return rsvpCount; }
    public void setRsvpCount(int rsvpCount) { this.rsvpCount = rsvpCount; }
    public String getRsvpNote() { return rsvpNote; }
    public void setRsvpNote(String rsvpNote) { this.rsvpNote = rsvpNote; }
    public LocalDateTime getRsvpAt() { return rsvpAt; }
    public void setRsvpAt(LocalDateTime rsvpAt) { this.rsvpAt = rsvpAt; }
    public int getCheckedInCount() { return checkedInCount; }
    public void setCheckedInCount(int checkedInCount) { this.checkedInCount = checkedInCount; }
    public LocalDateTime getFirstCheckedInAt() { return firstCheckedInAt; }
    public void setFirstCheckedInAt(LocalDateTime firstCheckedInAt) { this.firstCheckedInAt = firstCheckedInAt; }
    public LocalDateTime getLastCheckedInAt() { return lastCheckedInAt; }
    public void setLastCheckedInAt(LocalDateTime lastCheckedInAt) { this.lastCheckedInAt = lastCheckedInAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
