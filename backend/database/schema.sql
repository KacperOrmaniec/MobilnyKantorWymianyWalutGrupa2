
BEGIN;

-- =====================================================
-- 1. TABELA: konta
-- =====================================================

CREATE TABLE IF NOT EXISTS public.konta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login VARCHAR(100) NOT NULL UNIQUE,
    haslo TEXT NOT NULL,
    "Imie" VARCHAR(100) NOT NULL,
    "Nazwisko" VARCHAR(100) NOT NULL
);


-- =====================================================
-- 1a. TABELA: waluty
-- =====================================================
-- Słownik obsługiwanych walut. Nowa waluta = jeden INSERT poniżej.
-- Kod musi występować w tabeli C NBP (USD, EUR, CHF, GBP, JPY, CZK,
-- DKK, NOK, SEK, CAD, AUD, HUF, XDR). PLN to waluta rozliczeniowa.

CREATE TABLE IF NOT EXISTS public.waluty (
    kod VARCHAR(10) PRIMARY KEY,
    nazwa VARCHAR(50) NOT NULL
);

INSERT INTO public.waluty (kod, nazwa)
VALUES
    ('PLN', 'złoty polski'),
    ('EUR', 'euro'),
    ('USD', 'dolar amerykański'),
    ('CHF', 'frank szwajcarski'),
    ('GBP', 'funt szterling')
ON CONFLICT (kod) DO NOTHING;


-- =====================================================
-- 1b. TABELA: salda
-- =====================================================
-- Jeden wiersz na konto i walutę. Brak wiersza oznacza saldo 0;
-- wiersz powstaje przy pierwszym uznaniu konta w danej walucie.

CREATE TABLE IF NOT EXISTS public.salda (
    id_konta BIGINT NOT NULL
        REFERENCES public.konta(id),

    waluta VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod),

    saldo NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (saldo >= 0),

    PRIMARY KEY (id_konta, waluta)
);


-- =====================================================
-- DODANIE TESTOWYCH UŻYTKOWNIKÓW
-- =====================================================
-- Hasło testowe obu kont to test123. W bazie jest tylko jego hash
-- ASP.NET Core Identity (PasswordHasher, format V3), wygenerowany raz.

INSERT INTO public.konta (login, haslo, "Imie", "Nazwisko")
VALUES
    ('test', 'AQAAAAIAAYagAAAAEL92QF32yDtVH1vr8D8inuMYn1j53JXbYG2lVQdFIbB7C9YgvTsP4MRxM/z9XvzSzQ==', 'Adam', 'Kowalski'),
    ('test2', 'AQAAAAIAAYagAAAAEL92QF32yDtVH1vr8D8inuMYn1j53JXbYG2lVQdFIbB7C9YgvTsP4MRxM/z9XvzSzQ==', 'Adam', 'Kowalski')
ON CONFLICT (login) DO NOTHING;

-- Naprawa baz utworzonych ze starym seedem (jawne hasło).
UPDATE public.konta
SET haslo = 'AQAAAAIAAYagAAAAEL92QF32yDtVH1vr8D8inuMYn1j53JXbYG2lVQdFIbB7C9YgvTsP4MRxM/z9XvzSzQ=='
WHERE login IN ('test', 'test2') AND haslo = 'test123';

-- Po 2000 w każdej walucie, tylko przy pierwszym utworzeniu.
INSERT INTO public.salda (id_konta, waluta, saldo)
SELECT k.id, w.kod, 2000
FROM public.konta AS k
CROSS JOIN public.waluty AS w
WHERE k.login IN ('test', 'test2')
ON CONFLICT (id_konta, waluta) DO NOTHING;


-- =====================================================
-- 2. TABELA: historia_przelewów
-- =====================================================

CREATE TABLE IF NOT EXISTS public."historia_przelewów" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_nadawcy BIGINT NOT NULL
        REFERENCES public.konta(id),

    id_odbiorcy BIGINT NOT NULL
        REFERENCES public.konta(id),

    "Kwota" NUMERIC(18,2) NOT NULL
        CHECK ("Kwota" > 0),

    "Waluta" VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod),

    CONSTRAINT rozne_konta
        CHECK (id_nadawcy <> id_odbiorcy)
);


-- =====================================================
-- 3. TABELA: historia_przewalutowania
-- =====================================================

CREATE TABLE IF NOT EXISTS public.historia_przewalutowania (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_konta BIGINT NOT NULL
        REFERENCES public.konta(id),

    "Kurs_przewalutowania" NUMERIC(18,6) NOT NULL
        CHECK ("Kurs_przewalutowania" > 0),

    "Waluta_sprzedana" VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod),
    "Waluta_kupiona" VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod),

    "Kwota_sprzedana" NUMERIC(18,2) NOT NULL
        CHECK ("Kwota_sprzedana" > 0),

    "Kwota_kupiona" NUMERIC(18,2) NOT NULL
        CHECK ("Kwota_kupiona" > 0)
);


-- =====================================================
-- 3a. TABELA: historia_doladowan
-- =====================================================
-- Doładowania konta (na razie zawsze PLN).

CREATE TABLE IF NOT EXISTS public.historia_doladowan (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    id_konta BIGINT NOT NULL
        REFERENCES public.konta(id),

    "Kwota" NUMERIC(18,2) NOT NULL
        CHECK ("Kwota" > 0),

    "Waluta" VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod)
);


-- =====================================================
-- 4. TABELA: aktualne_kursy_walut
-- =====================================================

CREATE TABLE IF NOT EXISTS public."aktualne_kursy_walut" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    waluta VARCHAR(10) NOT NULL UNIQUE
        REFERENCES public.waluty(kod),

    kurs_zakupu NUMERIC(18,6) NOT NULL
        CHECK (kurs_zakupu > 0),

    kurs_sprzedazy NUMERIC(18,6) NOT NULL
        CHECK (kurs_sprzedazy > 0)
);


-- =====================================================
-- 5. TABELA: historyczne_kursy_walut
-- =====================================================

CREATE TABLE IF NOT EXISTS public."historyczne_kursy_walut" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    waluta VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod),

    kurs_avg NUMERIC(18,6) NOT NULL
        CHECK (kurs_avg > 0),

    data DATE NOT NULL,

    UNIQUE (waluta, data)
);


-- =====================================================
-- 6. PROCEDURA: przelew
-- =====================================================

CREATE OR REPLACE PROCEDURE public."przelew"(
    IN id_konta_nadawcy BIGINT,
    IN id_konta_nabywcy BIGINT,
    IN kwota NUMERIC,
    IN waluta VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_waluta VARCHAR(10);
    v_liczba_kont INTEGER;
BEGIN

    -- Walidacja
    IF id_konta_nadawcy IS NULL
       OR id_konta_nabywcy IS NULL
       OR id_konta_nadawcy = id_konta_nabywcy THEN
        RAISE EXCEPTION 'Nieprawidłowe konta przelewu';
    END IF;

    IF kwota IS NULL OR kwota <= 0
       OR kwota <> ROUND(kwota, 2) THEN
        RAISE EXCEPTION 'Nieprawidłowa kwota przelewu';
    END IF;

    v_waluta := UPPER(BTRIM(waluta));

    IF NOT EXISTS (SELECT 1 FROM public.waluty WHERE kod = v_waluta) THEN
        RAISE EXCEPTION 'Nieobsługiwana waluta';
    END IF;

    -- Blokujemy oba konta w ustalonej kolejności,
    -- aby uniknąć konfliktów przy równoległych przelewach.
    PERFORM k.id
    FROM public.konta AS k
    WHERE k.id IN (id_konta_nadawcy, id_konta_nabywcy)
    ORDER BY k.id
    FOR UPDATE;

    GET DIAGNOSTICS v_liczba_kont = ROW_COUNT;

    IF v_liczba_kont <> 2 THEN
        RAISE EXCEPTION 'Nadawca lub odbiorca nie istnieje';
    END IF;

    -- Zmniejszenie salda nadawcy (brak wiersza = saldo 0)
    -- (aliasy, bo parametr "waluta" ma tę samą nazwę co kolumna)
    UPDATE public.salda AS s
    SET saldo = s.saldo - kwota
    WHERE s.id_konta = id_konta_nadawcy
      AND s.waluta = v_waluta
      AND s.saldo >= kwota;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Niewystarczające saldo nadawcy';
    END IF;

    -- Zwiększenie salda odbiorcy
    INSERT INTO public.salda AS s (id_konta, waluta, saldo)
    VALUES (id_konta_nabywcy, v_waluta, kwota)
    ON CONFLICT ON CONSTRAINT salda_pkey
    DO UPDATE SET saldo = s.saldo + EXCLUDED.saldo;

    -- Historia przelewu
    INSERT INTO public."historia_przelewów"
        (id_nadawcy, id_odbiorcy, "Kwota", "Waluta")
    VALUES
        (id_konta_nadawcy, id_konta_nabywcy, kwota, v_waluta);

END;
$$;


-- =====================================================
-- 7. PROCEDURA: przewalutowanie
-- =====================================================

CREATE OR REPLACE PROCEDURE public."przewalutowanie"(
    IN id_konta BIGINT,
    IN "Waluta" VARCHAR,
    IN kwota NUMERIC,
    IN typ_transakci VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_waluta VARCHAR(10);
    v_typ VARCHAR(20);

    v_kurs NUMERIC(18,6);
    v_kwota_pln NUMERIC(18,2);

    v_waluta_sprzedana VARCHAR(10);
    v_waluta_kupiona VARCHAR(10);
    v_kwota_sprzedana NUMERIC(18,2);
    v_kwota_kupiona NUMERIC(18,2);
BEGIN

    v_waluta := UPPER(BTRIM("Waluta"));
    v_typ := UPPER(BTRIM(typ_transakci));

    -- Walidacja
    IF id_konta IS NULL THEN
        RAISE EXCEPTION 'Nieprawidłowe konto';
    END IF;

    IF kwota IS NULL OR kwota <= 0
       OR kwota <> ROUND(kwota, 2) THEN
        RAISE EXCEPTION 'Nieprawidłowa kwota';
    END IF;

    IF v_waluta = 'PLN'
       OR NOT EXISTS (SELECT 1 FROM public.waluty WHERE kod = v_waluta) THEN
        RAISE EXCEPTION 'Nieobsługiwana waluta';
    END IF;

    IF v_typ IS NULL OR v_typ NOT IN ('ZAKUP', 'SPRZEDAZ') THEN
        RAISE EXCEPTION 'Nieprawidłowy typ transakcji';
    END IF;

    -- Zablokowanie konta (wszystkie zmiany sald konta idą po kolei)
    PERFORM 1
    FROM public.konta AS k
    WHERE k.id = id_konta
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Konto nie istnieje';
    END IF;

    -- Pobranie aktualnego kursu
    SELECT
        CASE v_typ
            WHEN 'SPRZEDAZ' THEN k.kurs_zakupu
            WHEN 'ZAKUP' THEN k.kurs_sprzedazy
        END
    INTO v_kurs
    FROM public."aktualne_kursy_walut" AS k
    WHERE k.waluta = v_waluta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Brak kursu dla waluty %', v_waluta;
    END IF;

    v_kwota_pln := ROUND(kwota * v_kurs, 2);

    IF v_kwota_pln <= 0 THEN
        RAISE EXCEPTION 'Kwota po przeliczeniu jest zbyt mała';
    END IF;

    IF v_typ = 'SPRZEDAZ' THEN
        -- Użytkownik sprzedaje walutę i otrzymuje PLN
        v_waluta_sprzedana := v_waluta;
        v_kwota_sprzedana := kwota;
        v_waluta_kupiona := 'PLN';
        v_kwota_kupiona := v_kwota_pln;
    ELSE
        -- ZAKUP: użytkownik kupuje walutę za PLN
        v_waluta_sprzedana := 'PLN';
        v_kwota_sprzedana := v_kwota_pln;
        v_waluta_kupiona := v_waluta;
        v_kwota_kupiona := kwota;
    END IF;

    -- Zmniejszenie salda sprzedawanej waluty (brak wiersza = saldo 0)
    -- (parametr id_konta ma tę samą nazwę co kolumna, stąd przewalutowanie.id_konta)
    UPDATE public.salda AS s
    SET saldo = s.saldo - v_kwota_sprzedana
    WHERE s.id_konta = przewalutowanie.id_konta
      AND s.waluta = v_waluta_sprzedana
      AND s.saldo >= v_kwota_sprzedana;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Niewystarczające saldo %', v_waluta_sprzedana;
    END IF;

    -- Zwiększenie salda kupowanej waluty
    INSERT INTO public.salda AS s (id_konta, waluta, saldo)
    VALUES (przewalutowanie.id_konta, v_waluta_kupiona, v_kwota_kupiona)
    ON CONFLICT ON CONSTRAINT salda_pkey
    DO UPDATE SET saldo = s.saldo + EXCLUDED.saldo;

    INSERT INTO public.historia_przewalutowania
        (id_konta, "Kurs_przewalutowania",
         "Waluta_sprzedana", "Waluta_kupiona",
         "Kwota_sprzedana", "Kwota_kupiona")
    VALUES
        (id_konta, v_kurs,
         v_waluta_sprzedana, v_waluta_kupiona,
         v_kwota_sprzedana, v_kwota_kupiona);

END;
$$;


-- =====================================================
-- 8. PROCEDURA: zmiana_aktualnego_kursu_walut
-- =====================================================

CREATE OR REPLACE PROCEDURE public."zmiana_aktualnego_kursu_walut"(
    IN "Waluta" VARCHAR,
    IN "Kurs_zakupu" NUMERIC,
    IN "Kurs_sprzedazy" NUMERIC,
    OUT "Timestamp" TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF "Waluta" IS NULL OR BTRIM("Waluta") = '' THEN
        RAISE EXCEPTION 'Waluta nie może być pusta';
    END IF;

    IF "Kurs_zakupu" IS NULL OR "Kurs_zakupu" <= 0
       OR "Kurs_sprzedazy" IS NULL OR "Kurs_sprzedazy" <= 0 THEN
        RAISE EXCEPTION 'Kursy muszą być dodatnie';
    END IF;

    INSERT INTO public."aktualne_kursy_walut" AS t
        (waluta, kurs_zakupu, kurs_sprzedazy, "Timestamp")
    VALUES
        (UPPER(BTRIM("Waluta")),
         "Kurs_zakupu",
         "Kurs_sprzedazy",
         clock_timestamp())

    ON CONFLICT (waluta)
    DO UPDATE SET
        kurs_zakupu = EXCLUDED.kurs_zakupu,
        kurs_sprzedazy = EXCLUDED.kurs_sprzedazy,
        "Timestamp" = EXCLUDED."Timestamp"

    RETURNING t."Timestamp" INTO "Timestamp";

END;
$$;


-- =====================================================
-- 9. PROCEDURA: doladowanie
-- =====================================================

CREATE OR REPLACE PROCEDURE public."doladowanie"(
    IN id_konta BIGINT,
    IN kwota NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN

    -- Walidacja
    IF id_konta IS NULL THEN
        RAISE EXCEPTION 'Nieprawidłowe konto';
    END IF;

    IF kwota IS NULL OR kwota <= 0
       OR kwota <> ROUND(kwota, 2) THEN
        RAISE EXCEPTION 'Nieprawidłowa kwota doładowania';
    END IF;

    -- Zablokowanie konta (wszystkie zmiany sald konta idą po kolei)
    PERFORM 1
    FROM public.konta AS k
    WHERE k.id = doladowanie.id_konta
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Konto nie istnieje';
    END IF;

    -- Zwiększenie salda PLN
    -- (parametr id_konta ma tę samą nazwę co kolumna, stąd doladowanie.id_konta)
    INSERT INTO public.salda AS s (id_konta, waluta, saldo)
    VALUES (doladowanie.id_konta, 'PLN', kwota)
    ON CONFLICT ON CONSTRAINT salda_pkey
    DO UPDATE SET saldo = s.saldo + EXCLUDED.saldo;

    -- Historia doładowania
    INSERT INTO public.historia_doladowan (id_konta, "Kwota", "Waluta")
    VALUES (doladowanie.id_konta, kwota, 'PLN');

END;
$$;


-- =====================================================
-- 10. TABELA: alerty_kursowe
-- =====================================================
-- Jednorazowy alert użytkownika. Typ z perspektywy użytkownika (jak w przewalutowaniu):
-- ZAKUP spełniony, gdy kurs_sprzedazy <= prog; SPRZEDAZ, gdy kurs_zakupu >= prog.

CREATE TABLE IF NOT EXISTS public.alerty_kursowe (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_konta BIGINT NOT NULL
        REFERENCES public.konta(id),

    waluta VARCHAR(10) NOT NULL
        REFERENCES public.waluty(kod),

    typ VARCHAR(10) NOT NULL
        CHECK (typ IN ('ZAKUP', 'SPRZEDAZ')),

    prog NUMERIC(18,6) NOT NULL
        CHECK (prog > 0),

    utworzono TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    spelniono TIMESTAMPTZ NULL,
    kurs_spelnienia NUMERIC(18,6) NULL
);


-- =====================================================
-- 11. TRIGGERY: sprawdzanie alertów
-- =====================================================

-- Po każdej zmianie kursu oznacza spełnione alerty tej waluty.
CREATE OR REPLACE FUNCTION public.sprawdz_alerty_kursowe()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.alerty_kursowe AS a
    SET spelniono = now(),
        kurs_spelnienia = CASE a.typ WHEN 'ZAKUP' THEN NEW.kurs_sprzedazy ELSE NEW.kurs_zakupu END
    WHERE a.waluta = NEW.waluta
      AND a.spelniono IS NULL
      AND ((a.typ = 'ZAKUP' AND NEW.kurs_sprzedazy <= a.prog)
        OR (a.typ = 'SPRZEDAZ' AND NEW.kurs_zakupu >= a.prog));

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sprawdz_alerty_kursowe ON public."aktualne_kursy_walut";
CREATE TRIGGER sprawdz_alerty_kursowe
    AFTER INSERT OR UPDATE ON public."aktualne_kursy_walut"
    FOR EACH ROW EXECUTE FUNCTION public.sprawdz_alerty_kursowe();

-- Nowy alert, którego warunek już jest spełniony wg aktualnego kursu, od razu oznacza jako spełniony.
CREATE OR REPLACE FUNCTION public.sprawdz_nowy_alert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_kurs NUMERIC(18,6);
BEGIN
    SELECT CASE NEW.typ WHEN 'ZAKUP' THEN k.kurs_sprzedazy ELSE k.kurs_zakupu END
    INTO v_kurs
    FROM public."aktualne_kursy_walut" AS k
    WHERE k.waluta = NEW.waluta;

    IF (NEW.typ = 'ZAKUP' AND v_kurs <= NEW.prog)
       OR (NEW.typ = 'SPRZEDAZ' AND v_kurs >= NEW.prog) THEN
        NEW.spelniono := now();
        NEW.kurs_spelnienia := v_kurs;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sprawdz_nowy_alert ON public.alerty_kursowe;
CREATE TRIGGER sprawdz_nowy_alert
    BEFORE INSERT ON public.alerty_kursowe
    FOR EACH ROW EXECUTE FUNCTION public.sprawdz_nowy_alert();

COMMIT;
