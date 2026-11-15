package com.kidus.wedding.planning;

import java.util.List;

/** A typical Ethiopian wedding timeline. Offsets are days before the wedding (negative = after). */
final class StarterChecklist {

    record Item(int daysBefore, Category category, String title) {
    }

    private StarterChecklist() {
    }

    static final List<Item> ITEMS = List.of(
            new Item(365, Category.OTHER, "Agree on a total budget together"),
            new Item(360, Category.CEREMONY, "Pick the date (check fasting seasons like Abiy Tsom and Filseta)"),
            new Item(350, Category.GUESTS, "Write the first guest list with both families"),
            new Item(300, Category.VENUE, "Visit and book the reception hall"),
            new Item(300, Category.CEREMONY, "Book the church and meet the priest"),
            new Item(270, Category.PHOTO_VIDEO, "Book photographer and videographer"),
            new Item(270, Category.MUSIC, "Book the band or DJ and the MC"),
            new Item(240, Category.OTHER, "Choose the mizes and bridesmaids"),
            new Item(200, Category.FOOD, "Book catering and taste the menu"),
            new Item(180, Category.ATTIRE, "Order the wedding dress and habesha kemis"),
            new Item(180, Category.ATTIRE, "Order the groom's suit and the mizes' outfits"),
            new Item(170, Category.DECOR, "Book decoration and flowers"),
            new Item(160, Category.TRANSPORT, "Book the wedding cars"),
            new Item(120, Category.BEAUTY, "Book makeup and hair, and do a trial"),
            new Item(120, Category.GUESTS, "Add all guests to this app"),
            new Item(100, Category.GUESTS, "Send invitations from this app"),
            new Item(90, Category.RINGS, "Buy the wedding rings"),
            new Item(90, Category.CEREMONY, "Plan the melse with both families"),
            new Item(90, Category.HONEYMOON, "Book the honeymoon"),
            new Item(60, Category.FOOD, "Confirm the menu, with fasting and non-fasting options"),
            new Item(60, Category.MUSIC, "Choose and practise the first dance"),
            new Item(45, Category.TRANSPORT, "Arrange transport for elderly guests"),
            new Item(30, Category.GUESTS, "Make the seating plan"),
            new Item(30, Category.ATTIRE, "Final dress and suit fittings"),
            new Item(21, Category.OTHER, "Confirm times and payments with every vendor"),
            new Item(14, Category.GUESTS, "Follow up with guests who haven't replied"),
            new Item(10, Category.GUESTS, "Add door staff accounts and brief the ushers"),
            new Item(7, Category.VENUE, "Test the door scanner on the hall's Wi-Fi or mobile data"),
            new Item(7, Category.OTHER, "Give the MC the final schedule"),
            new Item(3, Category.OTHER, "Prepare envelopes for final vendor payments"),
            new Item(1, Category.OTHER, "Rest, eat well, charge every phone"),
            new Item(-7, Category.GUESTS, "Send thank-you messages to guests"),
            new Item(-10, Category.OTHER, "Return rented items and settle remaining payments"));
}
