package com.kidus.wedding.guest;

import com.kidus.wedding.common.ApiException;
import com.kidus.wedding.guest.GuestDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class GuestService {

    private final GuestRepository repo;

    public GuestService(GuestRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<GuestView> list(String search) {
        String q = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return repo.findAllByOrderByFullNameAsc().stream()
                .filter(g -> q.isEmpty()
                        || g.getFullName().toLowerCase(Locale.ROOT).contains(q)
                        || (g.getPhone() != null && g.getPhone().contains(q))
                        || g.getInviteCode().toLowerCase(Locale.ROOT).contains(q)
                        || (g.getTableName() != null && g.getTableName().toLowerCase(Locale.ROOT).contains(q)))
                .map(GuestView::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public GuestView get(Long id) {
        return GuestView.of(find(id));
    }

    @Transactional
    public GuestView create(GuestRequest req) {
        Guest g = new Guest();
        apply(g, req);
        g.setInviteCode(newUniqueCode());
        return GuestView.of(repo.save(g));
    }

    @Transactional
    public GuestView update(Long id, GuestRequest req) {
        Guest g = find(id);
        if (req.seats() < g.getCheckedInCount()) {
            throw ApiException.badRequest(g.getCheckedInCount() + " people already entered; seats cannot be lower than that");
        }
        apply(g, req);
        if (g.getRsvpCount() > g.getSeats()) g.setRsvpCount(g.getSeats());
        return GuestView.of(g);
    }

    @Transactional
    public void delete(Long id) {
        repo.delete(find(id));
    }

    @Transactional
    public GuestView regenerateCode(Long id) {
        Guest g = find(id);
        g.setInviteCode(newUniqueCode());
        return GuestView.of(g);
    }

    @Transactional
    public GuestView resetCheckin(Long id) {
        Guest g = find(id);
        g.setCheckedInCount(0);
        g.setFirstCheckedInAt(null);
        g.setLastCheckedInAt(null);
        return GuestView.of(g);
    }

    /** Public RSVP from the invitation page. */
    @Transactional
    public Guest rsvp(String code, RsvpRequest req) {
        Guest g = repo.findByInviteCode(InviteCodes.normalize(code))
                .orElseThrow(() -> ApiException.notFound("Invitation not found"));
        if (Boolean.TRUE.equals(req.attending())) {
            int count = req.count() == null ? g.getSeats() : req.count();
            if (count < 1 || count > g.getSeats()) {
                throw ApiException.badRequest("This invitation is for up to " + g.getSeats() + " people");
            }
            g.setRsvpStatus(RsvpStatus.ATTENDING);
            g.setRsvpCount(count);
        } else {
            g.setRsvpStatus(RsvpStatus.DECLINED);
            g.setRsvpCount(0);
        }
        g.setRsvpNote(blankToNull(req.note()));
        g.setRsvpAt(LocalDateTime.now());
        return g;
    }

    @Transactional(readOnly = true)
    public Stats stats() {
        List<Guest> all = repo.findAll();
        int seats = 0, attInv = 0, attPeople = 0, declined = 0, pending = 0, inInv = 0, inPeople = 0;
        for (Guest g : all) {
            seats += g.getSeats();
            switch (g.getRsvpStatus()) {
                case ATTENDING -> { attInv++; attPeople += g.getRsvpCount(); }
                case DECLINED -> declined++;
                case PENDING -> pending++;
            }
            if (g.getCheckedInCount() > 0) {
                inInv++;
                inPeople += g.getCheckedInCount();
            }
        }
        return new Stats(all.size(), seats, attInv, attPeople, declined, pending, inInv, inPeople);
    }

    /**
     * CSV columns (header row optional): name, phone, seats, side, table, notes.
     * Only "name" is required.
     */
    @Transactional
    public ImportResult importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Upload a CSV file");
        int created = 0, skipped = 0;
        List<String> errors = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNo = 0;
            while ((line = reader.readLine()) != null) {
                lineNo++;
                if (lineNo == 1 && line.startsWith("﻿")) line = line.substring(1);
                if (line.isBlank()) continue;
                List<String> cols = Csv.parseLine(line);
                String name = col(cols, 0);
                if (lineNo == 1 && name != null && name.toLowerCase(Locale.ROOT).contains("name")) continue; // header
                if (name == null) {
                    skipped++;
                    errors.add("Line " + lineNo + ": name is empty");
                    continue;
                }
                int seats = 1;
                String seatsRaw = col(cols, 2);
                if (seatsRaw != null) {
                    try {
                        seats = Integer.parseInt(seatsRaw);
                    } catch (NumberFormatException e) {
                        skipped++;
                        errors.add("Line " + lineNo + ": seats '" + seatsRaw + "' is not a number");
                        continue;
                    }
                }
                if (seats < 1 || seats > 50) {
                    skipped++;
                    errors.add("Line " + lineNo + ": seats must be between 1 and 50");
                    continue;
                }
                Guest g = new Guest();
                g.setFullName(truncate(name, 160));
                g.setPhone(truncate(col(cols, 1), 40));
                g.setSeats(seats);
                g.setSide(Side.parse(col(cols, 3)));
                g.setTableName(truncate(col(cols, 4), 60));
                g.setNotes(truncate(col(cols, 5), 500));
                g.setInviteCode(newUniqueCode());
                repo.save(g);
                created++;
            }
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the file: " + e.getMessage());
        }
        return new ImportResult(created, skipped, errors);
    }

    private void apply(Guest g, GuestRequest req) {
        g.setFullName(req.fullName().trim());
        g.setPhone(blankToNull(req.phone()));
        g.setSide(req.side() == null ? Side.BOTH : req.side());
        g.setTableName(blankToNull(req.tableName()));
        g.setSeats(req.seats());
        g.setNotes(blankToNull(req.notes()));
    }

    private Guest find(Long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Guest not found"));
    }

    private String newUniqueCode() {
        for (int i = 0; i < 10; i++) {
            String code = InviteCodes.generate();
            if (!repo.existsByInviteCode(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique invite code");
    }

    private static String col(List<String> cols, int i) {
        if (i >= cols.size()) return null;
        return blankToNull(cols.get(i));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
