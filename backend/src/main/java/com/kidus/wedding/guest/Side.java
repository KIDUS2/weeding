package com.kidus.wedding.guest;

public enum Side {
    BRIDE, GROOM, BOTH;

    public static Side parse(String value) {
        if (value == null || value.isBlank()) return BOTH;
        String v = value.trim().toUpperCase();
        if (v.startsWith("B") && v.contains("R")) return BRIDE;
        if (v.startsWith("G")) return GROOM;
        return BOTH;
    }
}
