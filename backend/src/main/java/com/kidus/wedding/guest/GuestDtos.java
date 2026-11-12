package com.kidus.wedding.guest;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class GuestDtos {

    private GuestDtos() {
    }

    public record GuestView(Long id, String fullName, String phone, Side side, String tableName, int seats,
                            String inviteCode, RsvpStatus rsvpStatus, int rsvpCount, String rsvpNote,
                            LocalDateTime rsvpAt, int checkedInCount, LocalDateTime firstCheckedInAt,
                            LocalDateTime lastCheckedInAt, String notes, LocalDateTime createdAt) {
        public static GuestView of(Guest g) {
            return new GuestView(g.getId(), g.getFullName(), g.getPhone(), g.getSide(), g.getTableName(),
                    g.getSeats(), g.getInviteCode(), g.getRsvpStatus(), g.getRsvpCount(), g.getRsvpNote(),
                    g.getRsvpAt(), g.getCheckedInCount(), g.getFirstCheckedInAt(), g.getLastCheckedInAt(),
                    g.getNotes(), g.getCreatedAt());
        }
    }

    public record GuestRequest(
            @NotBlank @Size(max = 160) String fullName,
            @Size(max = 40) String phone,
            Side side,
            @Size(max = 60) String tableName,
            @Min(1) @Max(50) int seats,
            @Size(max = 500) String notes) {
    }

    public record RsvpRequest(
            @NotNull Boolean attending,
            @Min(0) @Max(50) Integer count,
            @Size(max = 500) String note) {
    }

    public record ImportResult(int created, int skipped, List<String> errors) {
    }

    public record Stats(int invitations, int totalSeats,
                        int attendingInvitations, int attendingPeople,
                        int declinedInvitations, int pendingInvitations,
                        int checkedInInvitations, int checkedInPeople) {
    }
}
