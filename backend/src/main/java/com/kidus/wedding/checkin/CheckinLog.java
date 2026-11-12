package com.kidus.wedding.checkin;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkin_log")
public class CheckinLog {

    public enum Action { APPROVED, RESET }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "guest_id", nullable = false)
    private Long guestId;

    @Column(name = "guest_name", nullable = false)
    private String guestName;

    @Column(nullable = false)
    private int people;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    @Column(name = "scanned_by", nullable = false)
    private String scannedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected CheckinLog() {
    }

    public CheckinLog(Long guestId, String guestName, int people, Action action, String scannedBy) {
        this.guestId = guestId;
        this.guestName = guestName;
        this.people = people;
        this.action = action;
        this.scannedBy = scannedBy;
    }

    public Long getId() { return id; }
    public Long getGuestId() { return guestId; }
    public String getGuestName() { return guestName; }
    public int getPeople() { return people; }
    public Action getAction() { return action; }
    public String getScannedBy() { return scannedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
