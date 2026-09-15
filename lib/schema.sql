-- ============================================================
-- APLIKASI WAKASEK — Skema tambahan (tanpa pengguna/sesi, pakai better-auth)
-- ============================================================

-- 1. ENUM TYPES (PostgreSQL tidak support IF NOT EXISTS untuk TYPE)
DO $$ BEGIN
  CREATE TYPE bidang_wakasek AS ENUM ('kurikulum', 'kesiswaan', 'sarpras', 'humas');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_kegiatan AS ENUM ('belum_dimulai', 'terlaksana', 'ditunda', 'tidak_jadi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABEL PROGRAM KERJA
CREATE TABLE IF NOT EXISTS proker (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidang              bidang_wakasek NOT NULL,
  tahun_ajaran        TEXT NOT NULL,
  nama_kegiatan       TEXT NOT NULL,
  deskripsi           TEXT,
  bulan_pelaksanaan   INT[] NOT NULL,
  penanggung_jawab    TEXT NOT NULL,
  anggaran            BIGINT NOT NULL DEFAULT 0,
  sumber_dana         TEXT,
  dibuat_oleh         TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bulan_pelaksanaan_valid
    CHECK (bulan_pelaksanaan <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
  CONSTRAINT bulan_tidak_kosong
    CHECK (cardinality(bulan_pelaksanaan) > 0),
  CONSTRAINT anggaran_tidak_negatif
    CHECK (anggaran >= 0)
);

CREATE INDEX IF NOT EXISTS idx_proker_bidang        ON proker(bidang);
CREATE INDEX IF NOT EXISTS idx_proker_tahun_ajaran  ON proker(tahun_ajaran);
CREATE INDEX IF NOT EXISTS idx_proker_dibuat_oleh   ON proker(dibuat_oleh);

-- 3. TABEL REALISASI KEGIATAN
CREATE TABLE IF NOT EXISTS realisasi (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proker_id        UUID NOT NULL REFERENCES proker(id) ON DELETE CASCADE,
  bulan            INT NOT NULL,
  tahun            INT NOT NULL,
  status           status_kegiatan NOT NULL DEFAULT 'belum_dimulai',
  catatan          TEXT,
  dokumentasi      TEXT[],
  dilaporkan_oleh  TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bulan_realisasi_valid CHECK (bulan BETWEEN 1 AND 12),
  CONSTRAINT tahun_realisasi_valid CHECK (tahun BETWEEN 2000 AND 2100),
  UNIQUE (proker_id, bulan, tahun)
);

CREATE INDEX IF NOT EXISTS idx_realisasi_proker      ON realisasi(proker_id);
CREATE INDEX IF NOT EXISTS idx_realisasi_bulan_tahun ON realisasi(bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_realisasi_status      ON realisasi(status);

-- 4. FUNGSI & TRIGGER: auto-update updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proker_updated_at ON proker;
CREATE TRIGGER trg_proker_updated_at
  BEFORE UPDATE ON proker
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_realisasi_updated_at ON realisasi;
CREATE TRIGGER trg_realisasi_updated_at
  BEFORE UPDATE ON realisasi
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 5. FUNGSI BANTU: hapus sesi expired (better-auth session table)
CREATE OR REPLACE FUNCTION hapus_sesi_expired()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE jumlah INTEGER;
BEGIN
  DELETE FROM session WHERE "expiresAt" < NOW();
  GET DIAGNOSTICS jumlah = ROW_COUNT;
  RETURN jumlah;
END;
$$;
