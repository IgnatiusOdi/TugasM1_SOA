const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));

let pelanggans = [];
let menus = [];

let transactions = [];
let trans_id = 1;

let rukos = [];

function dateFormat() {
  const d = new Date();
  return `${(d.getDate() + "").padStart(2, "0")}/${(
    d.getMonth() +
    1 +
    ""
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

// NOMOR 1 /api/pelanggans
app.post("/api/pelanggans", (req, res) => {
  const { nama, jenis_kelamin, nomor_HP, email } = req.body;
  if (
    !nama ||
    !jenis_kelamin ||
    !nomor_HP ||
    !email ||
    (jenis_kelamin != "laki" && jenis_kelamin != "perempuan")
  ) {
    return res
      .status(400)
      .send({ message: "Terdapat field yang kosong/format salah/tidak ada!" });
  }

  const pelanggan = {
    id: `MXE${(pelanggans.length + 1 + "").padStart(3, "0")}`,
    nama,
    jenis_kelamin,
    nomor_HP,
    email,
    pembelian: [],
  };

  pelanggans.push(pelanggan);
  const resPelanggan = { ...pelanggan };
  delete resPelanggan.pembelian;

  return res.status(201).send(resPelanggan);
});

// NOMOR 2 /api/pelanggans/:id
app.get("/api/pelanggans/:id", (req, res) => {
  const { id } = req.params;
  const pelanggan = pelanggans.find((p) => p.id == id);
  if (!pelanggan) {
    return res
      .status(404)
      .send({ message: "Pelanggan Mixue tidak ditemukan!" });
  }

  return res.status(200).send(pelanggan);
});

// NOMOR 3 /api/pelanggans/:id
app.put("/api/pelanggans/:id", (req, res) => {
  const { id } = req.params;
  const { nama, jenis_kelamin, nomor_HP } = req.body;
  const pelanggan = pelanggans.find((p) => p.id == id);
  if (!pelanggan) {
    return res
      .status(404)
      .send({ message: "Pelanggan Mixue tidak ditemukan!" });
  }

  if (
    !nama ||
    !jenis_kelamin ||
    !nomor_HP ||
    (jenis_kelamin != "laki" && jenis_kelamin != "perempuan")
  ) {
    return res
      .status(400)
      .send({ message: "Terdapat field yang kosong/format salah/tidak ada!" });
  }

  pelanggan.nama = nama;
  pelanggan.jenis_kelamin = jenis_kelamin;
  pelanggan.nomor_HP = nomor_HP;

  const resPelanggan = { ...pelanggan };
  delete resPelanggan.pembelian;

  return res.status(201).send(resPelanggan);
});

// NOMOR 4 /api/menu
app.post("/api/menu", (req, res) => {
  const { nama, harga, jenis_minuman } = req.body;
  if (!nama || !harga || !jenis_minuman || isNaN(harga) || harga <= 0) {
    return res
      .status(400)
      .send({ message: "Terdapat field yang kosong/format salah/tidak ada!" });
  }

  const menu = {
    id: `M${(menus.length + 1 + "").padStart(3, "0")}`,
    nama,
    harga,
    banyak_dibeli: 0,
  };

  menus.push(menu);
  const resMenu = { ...menu, jenis_minuman, tanggal_ditambahkan: dateFormat() };
  delete resMenu.banyak_dibeli;

  return res.status(201).send(resMenu);
});

// NOMOR 5 /api/menu
app.get("/api/menu", (req, res) => {
  const { nama } = req.query;
  if (nama) {
    const menu = menus.find((m) =>
      m.nama.toUpperCase().includes(nama.toUpperCase())
    );

    if (!menu) {
      return res
        .status(404)
        .send({ message: "Minuman Mixue tidak ditemukan!" });
    }

    return res.status(200).send(menu);
  }

  return res.status(200).send(menus);
});

// NOMOR 6 /api/pesanans
app.post("/api/pesanans", (req, res) => {
  const { id_pelanggan, id_minuman, jumlah } = req.body;
  const pelanggan = pelanggans.find((p) => p.id == id_pelanggan);
  const menu = menus.find((m) => m.id == id_minuman);

  if (
    !id_pelanggan ||
    !pelanggan ||
    !id_minuman ||
    !menu ||
    !jumlah ||
    jumlah <= 0
  ) {
    return res
      .status(400)
      .send({ message: "Terdapat field yang kosong/format salah/tidak ada!" });
  }

  const trans = {
    id_transaksi: `T${(trans_id + "").padStart(3, "0")}`,
    nama_pelanggan: pelanggan.nama,
    nama_minuman: menu.nama,
    jumlah,
    harga_total: jumlah * menu.harga,
  };

  //TRANSAKSI
  trans_id++;
  transactions.push(trans);

  //JUMLAH DIBELI
  menu.banyak_dibeli = parseInt(menu.banyak_dibeli) + parseInt(jumlah) + "";

  //PEMBELIAN
  pelanggan.pembelian.push({
    trans_id: trans.id_transaksi,
    nama: trans.nama_minuman,
    jumlah,
  });

  return res.status(201).send(trans);
});

// NOMOR 7 /api/pesanans/:id
app.delete("/api/pesanans/:id", (req, res) => {
  const { id } = req.params;
  const trans = transactions.find((t) => t.id_transaksi == id);
  if (!trans) {
    return res.status(404).send({ message: "Pesanan Mixue tidak ditemukan!" });
  }

  const pelanggan = pelanggans.find((p) => p.nama == trans.nama_pelanggan);
  const menu = menus.find((m) => m.nama == trans.nama_minuman);
  const jumlah = trans.jumlah;

  //JUMLAH DIBELI
  menu.banyak_dibeli = parseInt(menu.banyak_dibeli) - parseInt(jumlah) + "";

  //PEMBELIAN
  pelanggan.pembelian.splice(pelanggan.pembelian.indexOf(trans), 1);

  //TRANSAKSI
  transactions.splice(transactions.indexOf(trans), 1);

  return res.status(200).send({ message: "Pesanan berhasil dibatalkan!" });
});

// NOMOR 8 /api/isi-ruko-kosong
app.post("/api/isi-ruko-kosong", (req, res) => {
  const { nama_pemilik, no_KTP, no_NPWP, jumlah_franchise } = req.body;
  if (
    !nama_pemilik ||
    !no_KTP ||
    !no_NPWP ||
    !jumlah_franchise ||
    jumlah_franchise <= 0
  ) {
    return res
      .status(400)
      .send({ message: "Terdapat field yang kosong/format salah/tidak ada!" });
  }

  const resRuko = [];
  for (let i = 0; i < jumlah_franchise; i++) {
    let ruko = {
      id_ruko: `R${(rukos.length + 1 + "").padStart(3, "0")}`,
      nama_pemilik,
      no_KTP,
      total_harga: "700 juta",
    };

    resRuko.push(ruko);
    rukos.push(ruko);
  }

  return res.status(201).send(resRuko);
});

const port = 3000;
app.listen(port, function () {
  console.log(`listening on port ${port}`);
});
