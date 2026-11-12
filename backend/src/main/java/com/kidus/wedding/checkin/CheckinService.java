package com.kidus.wedding.checkin;

import com.kidus.wedding.common.ApiException;
import com.kidus.wedding.guest.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CheckinService {

    private final GuestRepository guests;
    private final CheckinLogRepository logs;

    public CheckinService(GuestRepository guests, CheckinLogRepository logs) {
        this.guests = guests;
        this.logs = logs;
    }

    /** What the usher sees right after scanning, before approving. */
    public record ScanResult(Long guestId, String code, String guestName, Side side, String tableName,
                             int seats, int checkedInCount, int remaining,
                             RsvpStatus rsvpStatus, int rsvpCount, String notes,
                             LocalDateTime firstCheckedInAt, LocalDateTime lastCheckedInAt,
                             boolean fullyCheckedIn) {
        static ScanResult of(Guest g) {
            return new ScanResult(g.getId(), g.getInviteCode(), g.getFullName(), g.getSide(), g.getTableName(),
                    g.getSeats(), g.getCheckedInCount(), g.remainingSeats(),
                    g.getRsvpStatus(), g.getRsvpCount(), g.getNotes(),
                    g.getFirstCheckedInAt(), g.getLastCheckedInAt(), g.remainingSeats() == 0);
        }
    }

    public record LogView(Long id, Long guestId, String guestName, int people, CheckinLog.Action action,
                          String scannedBy, LocalDateTime at) {
        static LogView of(CheckinLog l) {
            return new LogView(l.getId(), l.getGuestId(), l.getGuestName(), l.getPeople(), l.getAction(),
                    l.getScannedBy(), l.getCreatedAt());
        }
    }

    @Transactional(readOnly = true)
    public ScanResult lookup(String rawCode) {
        return ScanResult.of(findGuest(rawCode, false));
    }

    @Transactional
    public ScanResult approve(String rawCode, int people, String usher) {
        Guest g = findGuest(rawCode, true);
        int remaining = g.remainingSeats();
        if (remaining == 0) {
            throw ApiException.conflict("All " + g.getSeats() + " seat(s) on this invitation have already entered");
        }
        if (people < 1 || people > remaining) {
            throw ApiException.badRequest("You can admit between 1 and " + remaining + " people on this invitation");
        }
        LocalDateTime now = LocalDateTime.now();
        g.setCheckedInCount(g.getCheckedInCount() + people);
        if (g.getFirstCheckedInAt() == null) g.setFirstCheckedInAt(now);
        g.setLastCheckedInAt(now);
        logs.save(new CheckinLog(g.getId(), g.getFullName(), people, CheckinLog.Action.APPROVED, usher));
        return ScanResult.of(g);
    }

    @Transactional(readOnly = true)
    public List<LogView> recent() {
        return logs.findTop30ByOrderByCreatedAtDesc().stream().map(LogView::of).toList();
    }

    private Guest findGuest(String rawCode, boolean lock) {
        String code = InviteCodes.normalize(rawCode);
        if (code.isEmpty()) throw ApiException.badRequest("No invitation code provided");
        return (lock ? guests.findByInviteCodeForUpdate(code) : guests.findByInviteCode(code))
                .orElseThrow(() -> ApiException.notFound("No invitation found for code " + code + ". This QR is not valid."));
    }
}
