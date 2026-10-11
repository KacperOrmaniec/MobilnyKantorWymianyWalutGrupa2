
BEGIN;

-- =====================================================
-- 1. TABELA: konta
-- =====================================================

CREATE TABLE IF NOT EXISTS public.konta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login VARCHAR(100) NOT NULL UNIQUE,
    haslo TEXT NOT NULL,
    "Imie" VARCHAR(100) NOT NULL,
    "Nazwisko" VARCHAR(100) NOT NULL,

    "Aktualne_Saldo_PLN" NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK ("Aktualne_Saldo_PLN" >= 0),

    "Aktualne_Saldo_EUR" NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK ("Aktualne_Saldo_EUR" >= 0),

    "Aktualne_Saldo_USD" NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK ("Aktualne_Saldo_USD" >= 0)
);


-- =====================================================
-- DODANIE TESTOWYCH UŻYTKOWNIKÓW
-- =====================================================

INSERT INTO public.konta (
    login,
    haslo,
    "Imie",
    "Nazwisko",
    "Aktualne_Saldo_PLN",
    "Aktualne_Saldo_EUR",
    "Aktualne_Saldo_USD"
)
VALUES
    ('test', 'test123', 'Adam', 'Kowalski', 2000, 2000, 2000),
    ('test2', 'test123', 'Adam', 'Kowalski', 2000, 2000, 2000)
ON CONFLICT (login) DO NOTHING;


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
        CHECK ("Waluta" IN ('PLN', 'EUR', 'USD')),

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

    "Waluta_sprzedana" VARCHAR(10) NOT NULL,
    "Waluta_kupiona" VARCHAR(10) NOT NULL,

    "Kwota_sprzedana" NUMERIC(18,2) NOT NULL
        CHECK ("Kwota_sprzedana" > 0),

    "Kwota_kupiona" NUMERIC(18,2) NOT NULL
        CHECK ("Kwota_kupiona" > 0)
);


-- =====================================================
-- 4. TABELA: aktualne_kursy_walut
-- =====================================================

CREATE TABLE IF NOT EXISTS public."aktualne_kursy_walut" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "Timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    waluta VARCHAR(10) NOT NULL UNIQUE,

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
    waluta VARCHAR(10) NOT NULL,

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
    v_saldo NUMERIC(18,2);
    v_liczba_kont INTEGER;
BEGIN

    -- Walidacja
    IF id_konta_nadawcy IS NULL
       OR id_konta_nabywcy IS NULL
       OR id_konta_nadawcy = id_konta_nabywcy THEN
        RAISE EXCEPTION 'Nieprawidlowe konta przelewu';
    END IF;

    IF kwota IS NULL OR kwota <= 0
       OR kwota <> ROUND(kwota, 2) THEN
        RAISE EXCEPTION 'Nieprawidlowa kwota przelewu';
    END IF;

    v_waluta := UPPER(BTRIM(waluta));

    IF v_waluta IS NULL
       OR v_waluta NOT IN ('PLN', 'EUR', 'USD') THEN
        RAISE EXCEPTION 'Nieobslugiwana waluta';
    END IF;

    -- Blokujemy oba konta w ustalonej kolejnosci,
    -- aby uniknac konfliktow przy rownoleglych przelewach.
    PERFORM k.id
    FROM public.konta AS k
    WHERE k.id IN (id_konta_nadawcy, id_konta_nabywcy)
    ORDER BY k.id
    FOR UPDATE;

    GET DIAGNOSTICS v_liczba_kont = ROW_COUNT;

    IF v_liczba_kont <> 2 THEN
        RAISE EXCEPTION 'Nadawca lub odbiorca nie istnieje';
    END IF;

    -- Sprawdzenie salda nadawcy
    SELECT CASE v_waluta
        WHEN 'PLN' THEN k."Aktualne_Saldo_PLN"
        WHEN 'EUR' THEN k."Aktualne_Saldo_EUR"
        WHEN 'USD' THEN k."Aktualne_Saldo_USD"
    END
    INTO v_saldo
    FROM public.konta AS k
    WHERE k.id = id_konta_nadawcy;

    IF v_saldo < kwota THEN
        RAISE EXCEPTION 'Niewystarczajace saldo nadawcy';
    END IF;

    -- Zmniejszenie salda nadawcy
    UPDATE public.konta
    SET
        "Aktualne_Saldo_PLN" = "Aktualne_Saldo_PLN"
            - CASE WHEN v_waluta = 'PLN' THEN kwota ELSE 0 END,

        "Aktualne_Saldo_EUR" = "Aktualne_Saldo_EUR"
            - CASE WHEN v_waluta = 'EUR' THEN kwota ELSE 0 END,

        "Aktualne_Saldo_USD" = "Aktualne_Saldo_USD"
            - CASE WHEN v_waluta = 'USD' THEN kwota ELSE 0 END

    WHERE id = id_konta_nadawcy;

    -- Zwiekszenie salda odbiorcy
    UPDATE public.konta
    SET
        "Aktualne_Saldo_PLN" = "Aktualne_Saldo_PLN"
            + CASE WHEN v_waluta = 'PLN' THEN kwota ELSE 0 END,

        "Aktualne_Saldo_EUR" = "Aktualne_Saldo_EUR"
            + CASE WHEN v_waluta = 'EUR' THEN kwota ELSE 0 END,

        "Aktualne_Saldo_USD" = "Aktualne_Saldo_USD"
            + CASE WHEN v_waluta = 'USD' THEN kwota ELSE 0 END

    WHERE id = id_konta_nabywcy;

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

    v_saldo_pln NUMERIC(18,2);
    v_saldo_waluty NUMERIC(18,2);
BEGIN

    v_waluta := UPPER(BTRIM("Waluta"));
    v_typ := UPPER(BTRIM(typ_transakci));

    -- Walidacja
    IF id_konta IS NULL THEN
        RAISE EXCEPTION 'Nieprawidlowe konto';
    END IF;

    IF kwota IS NULL OR kwota <= 0
       OR kwota <> ROUND(kwota, 2) THEN
        RAISE EXCEPTION 'Nieprawidlowa kwota';
    END IF;

    IF v_waluta IS NULL OR v_waluta NOT IN ('EUR', 'USD') THEN
        RAISE EXCEPTION 'Nieobslugiwana waluta';
    END IF;

    IF v_typ IS NULL OR v_typ NOT IN ('ZAKUP', 'SPRZEDAZ') THEN
        RAISE EXCEPTION 'Nieprawidlowy typ transakcji';
    END IF;

    -- Pobranie i zablokowanie konta
    SELECT
        k."Aktualne_Saldo_PLN",
        CASE v_waluta
            WHEN 'EUR' THEN k."Aktualne_Saldo_EUR"
            WHEN 'USD' THEN k."Aktualne_Saldo_USD"
        END
    INTO v_saldo_pln, v_saldo_waluty
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
        RAISE EXCEPTION 'Kwota po przeliczeniu jest zbyt mala';
    END IF;

    -- SPRZEDAZ: użytkownik sprzedaje EUR/USD i otrzymuje PLN
    IF v_typ = 'SPRZEDAZ' THEN

        IF v_saldo_waluty < kwota THEN
            RAISE EXCEPTION 'Niewystarczajace saldo walutowe';
        END IF;

        UPDATE public.konta
        SET
            "Aktualne_Saldo_PLN" = "Aktualne_Saldo_PLN"
                + v_kwota_pln,

            "Aktualne_Saldo_EUR" = "Aktualne_Saldo_EUR"
                - CASE WHEN v_waluta = 'EUR' THEN kwota ELSE 0 END,

            "Aktualne_Saldo_USD" = "Aktualne_Saldo_USD"
                - CASE WHEN v_waluta = 'USD' THEN kwota ELSE 0 END

        WHERE id = id_konta;

        INSERT INTO public.historia_przewalutowania
            (id_konta, "Kurs_przewalutowania",
             "Waluta_sprzedana", "Waluta_kupiona",
             "Kwota_sprzedana", "Kwota_kupiona")
        VALUES
            (id_konta, v_kurs,
             v_waluta, 'PLN',
             kwota, v_kwota_pln);

    -- ZAKUP: użytkownik kupuje EUR/USD za PLN
    ELSE

        IF v_saldo_pln < v_kwota_pln THEN
            RAISE EXCEPTION 'Niewystarczajace saldo PLN';
        END IF;

        UPDATE public.konta
        SET
            "Aktualne_Saldo_PLN" = "Aktualne_Saldo_PLN"
                - v_kwota_pln,

            "Aktualne_Saldo_EUR" = "Aktualne_Saldo_EUR"
                + CASE WHEN v_waluta = 'EUR' THEN kwota ELSE 0 END,

            "Aktualne_Saldo_USD" = "Aktualne_Saldo_USD"
                + CASE WHEN v_waluta = 'USD' THEN kwota ELSE 0 END

        WHERE id = id_konta;

        INSERT INTO public.historia_przewalutowania
            (id_konta, "Kurs_przewalutowania",
             "Waluta_sprzedana", "Waluta_kupiona",
             "Kwota_sprzedana", "Kwota_kupiona")
        VALUES
            (id_konta, v_kurs,
             'PLN', v_waluta,
             v_kwota_pln, kwota);

    END IF;

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
        RAISE EXCEPTION 'Waluta nie moze byc pusta';
    END IF;

    IF "Kurs_zakupu" IS NULL OR "Kurs_zakupu" <= 0
       OR "Kurs_sprzedazy" IS NULL OR "Kurs_sprzedazy" <= 0 THEN
        RAISE EXCEPTION 'Kursy musza byc dodatnie';
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

COMMIT;
