package com.kidus.wedding.auth;

public enum Role {
    /** Full access: guests, settings, staff, scanning. */
    ADMIN,
    /** Door staff: can only scan and approve entry. */
    USHER
}
