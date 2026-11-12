package com.kidus.wedding.guest;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class InviteCodesTest {

    @Test
    void generatesCodesFromSafeAlphabet() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            String c = InviteCodes.generate();
            assertEquals(InviteCodes.LENGTH, c.length());
            assertTrue(c.chars().allMatch(ch -> InviteCodes.ALPHABET.indexOf(ch) >= 0));
            seen.add(c);
        }
        assertEquals(1000, seen.size());
    }

    @Test
    void normalizesUrlsAndRawCodes() {
        assertEquals("ABC234XYZ9", InviteCodes.normalize("https://wedding.example.com/invite/ABC234XYZ9"));
        assertEquals("ABC234XYZ9", InviteCodes.normalize("https://wedding.example.com/invite/ABC234XYZ9/?utm=x"));
        assertEquals("ABC234XYZ9", InviteCodes.normalize("  abc234xyz9 "));
        assertEquals("", InviteCodes.normalize(null));
    }

    @Test
    void parsesCsvWithQuotes() {
        assertEquals(List.of("Abebe, Kebede", "0911", "3"), Csv.parseLine("\"Abebe, Kebede\",0911,3"));
        assertEquals(List.of("He said \"hi\"", ""), Csv.parseLine("\"He said \"\"hi\"\"\","));
    }

    @Test
    void parsesSide() {
        assertEquals(Side.BRIDE, Side.parse("bride"));
        assertEquals(Side.GROOM, Side.parse("Groom"));
        assertEquals(Side.BOTH, Side.parse("both"));
        assertEquals(Side.BOTH, Side.parse(null));
    }
}
