package com.kidus.wedding.media;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FileSnifferTest {

    private static byte[] b(int... v) {
        byte[] out = new byte[v.length];
        for (int i = 0; i < v.length; i++) out[i] = (byte) v[i];
        return out;
    }

    @Test
    void detectsImagesAndAudio() {
        assertEquals("image/jpeg", FileSniffer.detect(b(0xFF, 0xD8, 0xFF, 0xE0)).orElseThrow().contentType());
        assertEquals("image/png", FileSniffer.detect(b(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)).orElseThrow().contentType());
        assertEquals("image/webp", FileSniffer.detect("RIFF0000WEBPVP8 ".getBytes()).orElseThrow().contentType());
        assertEquals(Media.Kind.MUSIC, FileSniffer.detect("ID3\u0004".getBytes()).orElseThrow().kind());
        assertEquals("audio/mp4", FileSniffer.detect("\0\0\0 ftypM4A ".getBytes()).orElseThrow().contentType());
        assertEquals("audio/ogg", FileSniffer.detect("OggS\0".getBytes()).orElseThrow().contentType());
    }

    @Test
    void rejectsDisguisedFiles() {
        assertTrue(FileSniffer.detect("<html><script>".getBytes()).isEmpty());
        assertTrue(FileSniffer.detect("%PDF-1.7".getBytes()).isEmpty());
        assertTrue(FileSniffer.detect(new byte[0]).isEmpty());
    }
}
