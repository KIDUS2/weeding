package com.kidus.wedding.guest;

import java.security.SecureRandom;

/**
 * Invite codes are random, unguessable and avoid look-alike characters
 * (no 0/O, 1/I/L) so they can also be typed by hand at the door.
 */
public final class InviteCodes {

    static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    static final int LENGTH = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private InviteCodes() {
    }

    public static String generate() {
        StringBuilder sb = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    /**
     * Accepts a raw code, a full invitation URL (".../invite/ABC123") or
     * whatever the QR scanner returned, and returns the bare upper-case code.
     */
    public static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        int q = s.indexOf('?');
        if (q >= 0) s = s.substring(0, q);
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        int slash = s.lastIndexOf('/');
        if (slash >= 0) s = s.substring(slash + 1);
        return s.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    }
}
