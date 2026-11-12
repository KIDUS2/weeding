package com.kidus.wedding.guest;

import com.kidus.wedding.common.ApiException;
import com.kidus.wedding.event.EventController.EventView;
import com.kidus.wedding.event.WeddingEvent;
import com.kidus.wedding.event.WeddingEventRepository;
import com.kidus.wedding.guest.GuestDtos.RsvpRequest;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Endpoints used by the guest's personal invitation page (no login). */
@RestController
@RequestMapping("/api/public/invites")
public class PublicInviteController {

    private final GuestRepository guests;
    private final GuestService guestService;
    private final WeddingEventRepository events;

    public PublicInviteController(GuestRepository guests, GuestService guestService, WeddingEventRepository events) {
        this.guests = guests;
        this.guestService = guestService;
        this.events = events;
    }

    /** Deliberately excludes phone/notes: anyone holding the link sees this. */
    public record InviteView(String code, String guestName, int seats, Side side, String tableName,
                             RsvpStatus rsvpStatus, int rsvpCount, int checkedInCount, EventView event) {
    }

    @GetMapping("/{code}")
    @Transactional(readOnly = true)
    public InviteView get(@PathVariable String code) {
        Guest g = guests.findByInviteCode(InviteCodes.normalize(code))
                .orElseThrow(() -> ApiException.notFound("Invitation not found"));
        return view(g);
    }

    @PostMapping("/{code}/rsvp")
    @Transactional
    public InviteView rsvp(@PathVariable String code, @Valid @RequestBody RsvpRequest req) {
        return view(guestService.rsvp(code, req));
    }

    private InviteView view(Guest g) {
        EventView event = events.findById(WeddingEvent.SINGLETON_ID).map(EventView::of).orElse(null);
        return new InviteView(g.getInviteCode(), g.getFullName(), g.getSeats(), g.getSide(), g.getTableName(),
                g.getRsvpStatus(), g.getRsvpCount(), g.getCheckedInCount(), event);
    }
}
