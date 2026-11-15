package com.kidus.wedding.media;

import java.util.Optional;

/**
 * Detects the real file type from its first bytes, so a renamed file
 * (e.g. an .html saved as .jpg) can't be uploaded and served publicly.
 */
final class FileSniffer {

    record Type(String contentType, String extension, Media.Kind kind) {
    }

    private FileSniffer() {
    }

    static Optional<Type> detect(byte[] h) {
        if (h.length >= 3 && u(h[0]) == 0xFF && u(h[1]) == 0xD8 && u(h[2]) == 0xFF)
            return Optional.of(new Type("image/jpeg", "jpg", Media.Kind.PHOTO));
        if (h.length >= 8 && u(h[0]) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G')
            return Optional.of(new Type("image/png", "png", Media.Kind.PHOTO));
        if (h.length >= 12 && ascii(h, 0, "RIFF") && ascii(h, 8, "WEBP"))
            return Optional.of(new Type("image/webp", "webp", Media.Kind.PHOTO));
        if (h.length >= 3 && ascii(h, 0, "ID3"))
            return Optional.of(new Type("audio/mpeg", "mp3", Media.Kind.MUSIC));
        if (h.length >= 2 && u(h[0]) == 0xFF && (u(h[1]) & 0xE0) == 0xE0)
            return Optional.of(new Type("audio/mpeg", "mp3", Media.Kind.MUSIC));
        if (h.length >= 4 && ascii(h, 0, "OggS"))
            return Optional.of(new Type("audio/ogg", "ogg", Media.Kind.MUSIC));
        if (h.length >= 12 && ascii(h, 4, "ftyp")) {
            String brand = new String(h, 8, 4);
            if (brand.startsWith("M4A") || brand.startsWith("mp4") || brand.startsWith("isom") || brand.startsWith("dash"))
                return Optional.of(new Type("audio/mp4", "m4a", Media.Kind.MUSIC));
        }
        return Optional.empty();
    }

    private static int u(byte b) {
        return b & 0xFF;
    }

    private static boolean ascii(byte[] h, int off, String s) {
        if (h.length < off + s.length()) return false;
        for (int i = 0; i < s.length(); i++) if (h[off + i] != s.charAt(i)) return false;
        return true;
    }
}
