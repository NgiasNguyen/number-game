// ===== KHỞI TẠO BIẾN GIAO DIỆN =====
const trangThaiAIEl = document.getElementById("trangThaiAI");
const mucTieuSoEl = document.getElementById("mucTieuSo");
const tongDiemEl = document.getElementById("tongDiem");
const soLanDungEl = document.getElementById("soLanDung");
const soLanSaiEl = document.getElementById("soLanSai");
const tbDoTinCayEl = document.getElementById("tbDoTinCay");
const tongKetAIEl = document.getElementById("tongKetAI");
const noiDungBaoCaoSoEl = document.getElementById("noiDungBaoCaoSo");
const nutXoa = document.getElementById("nutXoa");
const nutChamDiem = document.getElementById("nutChamDiem");
const bangVe = document.getElementById("bangVe");
const doDayButEl = document.getElementById("doDayBut");
const hienThiDoDayEl = document.getElementById("hienThiDoDay");
const cacNutMau = document.querySelectorAll(".nut-mau");
const nenPopupKetQuaEl = document.getElementById("nenPopupKetQua");
const popupKetQuaEl = document.getElementById("popupKetQua");
const popupTieuDeEl = document.getElementById("popupTieuDe");
const popupDuDoanEl = document.getElementById("popupDuDoan");
const popupSoDungEl = document.getElementById("popupSoDung");
const popupDiemEl = document.getElementById("popupDiem");
const nutDongPopupEl = document.getElementById("nutDongPopup");

const context = bangVe.getContext("2d");
let model = null;
let dangVe = false;
let soMucTieu = 0;
let doDayBut = Number(doDayButEl.value);
let mauBut = "#000000";

const thongKe = {
  tongDiem: 0,
  dung: 0,
  sai: 0,
  tongDoTinCayDung: 0,
  soLanCham: 0,
};
const thongKeTheoSo = Array.from({ length: 10 }, () => ({
  dung: 0,
  sai: 0,
  soLanCham: 0,
  tongDoChinhXac: 0,
}));

// ===== AI MODEL LOADING =====
async function taiModelAI() {
  if (!trangThaiAIEl) {
    return;
  }

  if (window.location.protocol === "file:") {
    trangThaiAIEl.textContent =
      "Vui lòng mở bằng local server (ví dụ: python3 -m http.server 8000)";
    return;
  }

  trangThaiAIEl.textContent = "Đang tải AI...";

  try {
    model = await window.tf.loadLayersModel("./model/model.json");
    trangThaiAIEl.textContent = "AI đã sẵn sàng!";
  } catch (error) {
    const loi = error instanceof Error ? error.message : String(error);
    trangThaiAIEl.textContent = `Tải AI thất bại: ${loi}`;
  }
}

// ===== CANVAS DRAWING =====
function veNenTrang() {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, bangVe.width, bangVe.height);
  veNetDutHuongDan();
}

function khoiTaoButVe() {
  context.lineWidth = doDayBut;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = mauBut;
}

function veNetDutHuongDan() {
  context.save();
  context.strokeStyle = "#c5cbd8";
  context.setLineDash([10, 8]);
  context.lineWidth = 4;
  context.font = "220px 'Comic Sans MS', Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeText(String(soMucTieu), bangVe.width / 2, bangVe.height / 2 + 12);
  context.restore();
}

function layToaDo(event) {
  const rect = bangVe.getBoundingClientRect();
  const scaleX = bangVe.width / rect.width;
  const scaleY = bangVe.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function batDauVe(event) {
  dangVe = true;
  const { x, y } = layToaDo(event);
  context.beginPath();
  context.moveTo(x, y);
}

function dangVeSo(event) {
  if (!dangVe) {
    return;
  }
  const { x, y } = layToaDo(event);
  context.lineTo(x, y);
  context.stroke();
}

function ketThucVe() {
  dangVe = false;
  context.closePath();
}

function xoaBang() {
  veNenTrang();
}

// ===== TIỀN XỬ LÝ ẢNH CHO MNIST =====
function taoTensorTuBangVe() {
  return window.tf.tidy(() => {
    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = 28;
    resizedCanvas.height = 28;
    const resizedCtx = resizedCanvas.getContext("2d");
    resizedCtx.drawImage(bangVe, 0, 0, 28, 28);

    const duLieuAnh = resizedCtx.getImageData(0, 0, 28, 28);
    const duLieuXam = new Float32Array(28 * 28);

    for (let i = 0; i < duLieuAnh.data.length; i += 4) {
      const r = duLieuAnh.data[i];
      const g = duLieuAnh.data[i + 1];
      const b = duLieuAnh.data[i + 2];
      const giaTriXam = (r + g + b) / 3;
      const mucDen = 255 - giaTriXam;
      duLieuXam[i / 4] = mucDen / 255;
    }

    return window.tf.tensor4d(duLieuXam, [1, 28, 28, 1]);
  });
}

// ===== PREDICTION =====
function capNhatNhiemVuMoi() {
  soMucTieu = Math.floor(Math.random() * 10);
  mucTieuSoEl.textContent = `Hãy viết số ${soMucTieu}`;
  veNenTrang();
}

function tongKetBangLoiVan() {
  if (thongKe.soLanCham === 0) {
    return "Hãy bắt đầu để AI đánh giá nhé!";
  }

  const tyLeDung = thongKe.dung / thongKe.soLanCham;
  const tbDoTinCay = thongKe.dung > 0 ? thongKe.tongDoTinCayDung / thongKe.dung : 0;

  if (tyLeDung >= 0.8 && tbDoTinCay >= 80) {
    return "Bạn viết số rất tốt!";
  }
  if (tyLeDung >= 0.5) {
    return "Bạn đang tiến bộ! Cố gắng thêm nhé!";
  }
  return "Bạn cần luyện thêm độ chính xác.";
}

function hienPopupKetQua(laDung, duDoanSo, doTinCay, diemLanNay, soDung) {
  popupKetQuaEl.classList.remove("popup-dung", "popup-sai");
  popupTieuDeEl.textContent = laDung ? "Tuyệt vời!" : "Sắp được rồi, thử lại nhé!";
  popupDuDoanEl.textContent = `AI đoán số của bạn: ${duDoanSo} (${doTinCay.toFixed(1)}%)`;
  popupSoDungEl.textContent = `Số đúng: ${soDung}`;
  popupDiemEl.textContent = `Điểm của bạn: ${diemLanNay.toFixed(1)}`;

  if (laDung) {
    popupKetQuaEl.classList.add("popup-dung");
  } else {
    popupKetQuaEl.classList.add("popup-sai");
  }

  nenPopupKetQuaEl.classList.remove("an-di");
}

function dongPopupKetQua() {
  nenPopupKetQuaEl.classList.add("an-di");
}

function capNhatBangBaoCaoTheoSo() {
  let html = "";

  for (let so = 0; so <= 9; so += 1) {
    const tk = thongKeTheoSo[so];
    const doChinhXacTB = tk.soLanCham > 0 ? tk.tongDoChinhXac / tk.soLanCham : 0;
    const lopDung = tk.dung >= 1 ? "so-lieu-xanh" : "";
    const lopSai = tk.sai >= 1 ? "so-lieu-do" : "";
    let lopChinhXac = "";

    if (tk.soLanCham > 0) {
      if (doChinhXacTB > 50) {
        lopChinhXac = "so-lieu-xanh";
      } else if (doChinhXacTB < 50) {
        lopChinhXac = "so-lieu-do";
      }
    }

    html += `
      <tr>
        <td>${so}</td>
        <td class="${lopDung}">${tk.dung}</td>
        <td class="${lopSai}">${tk.sai}</td>
        <td class="${lopChinhXac}">${doChinhXacTB.toFixed(1)}%</td>
      </tr>
    `;
  }

  noiDungBaoCaoSoEl.innerHTML = html;
}

// ===== SCORING + REPORT SYSTEM =====
function capNhatBaoCao(laDung, doTinCay) {
  thongKe.soLanCham += 1;

  if (laDung) {
    thongKe.dung += 1;
    thongKe.tongDoTinCayDung += doTinCay;
    thongKeTheoSo[soMucTieu].dung += 1;
    thongKeTheoSo[soMucTieu].tongDoChinhXac += doTinCay;
  } else {
    thongKe.sai += 1;
    thongKeTheoSo[soMucTieu].sai += 1;
  }
  thongKeTheoSo[soMucTieu].soLanCham += 1;

  const doTinCayTB = thongKe.dung > 0 ? thongKe.tongDoTinCayDung / thongKe.dung : 0;

  tongDiemEl.textContent = thongKe.tongDiem.toFixed(1);
  soLanDungEl.textContent = String(thongKe.dung);
  soLanSaiEl.textContent = String(thongKe.sai);
  tbDoTinCayEl.textContent = `${doTinCayTB.toFixed(1)}%`;
  capNhatBangBaoCaoTheoSo();
  tongKetAIEl.textContent = tongKetBangLoiVan();
}

async function aiChamDiem() {
  if (!model) {
    popupTieuDeEl.textContent = "AI chưa sẵn sàng";
    popupDuDoanEl.textContent = "AI đang tải, bé chờ một chút nhé!";
    popupSoDungEl.textContent = `Số đúng: ${soMucTieu}`;
    popupDiemEl.textContent = "Điểm của bạn: -";
    popupKetQuaEl.classList.remove("popup-dung", "popup-sai");
    nenPopupKetQuaEl.classList.remove("an-di");
    return;
  }

  let duDoanSo = -1;
  let doTinCay = 0;

  try {
    const inputTensor = taoTensorTuBangVe();
    const output = model.predict(inputTensor);
    const ketQua = await output.data();

    const mangKetQua = Array.from(ketQua);
    doTinCay = Math.max(...mangKetQua) * 100;
    duDoanSo = mangKetQua.indexOf(Math.max(...mangKetQua));

    inputTensor.dispose();
    output.dispose();
  } catch (error) {
    const loi = error instanceof Error ? error.message : String(error);
    popupTieuDeEl.textContent = "Có lỗi khi chấm điểm";
    popupDuDoanEl.textContent = loi;
    popupSoDungEl.textContent = `Số đúng: ${soMucTieu}`;
    popupDiemEl.textContent = "Điểm của bạn: -";
    popupKetQuaEl.classList.remove("popup-dung", "popup-sai");
    nenPopupKetQuaEl.classList.remove("an-di");
    return;
  }

  const laDung = duDoanSo === soMucTieu;
  const diemLanNay = laDung ? doTinCay / 10 : 0;
  thongKe.tongDiem += diemLanNay;

  hienPopupKetQua(laDung, duDoanSo, doTinCay, diemLanNay, soMucTieu);
  capNhatBaoCao(laDung, doTinCay);
  capNhatNhiemVuMoi();
}

function ganSuKien() {
  bangVe.addEventListener("pointerdown", batDauVe);
  bangVe.addEventListener("pointermove", dangVeSo);
  window.addEventListener("pointerup", ketThucVe);
  bangVe.addEventListener("pointerleave", ketThucVe);

  nutXoa.addEventListener("click", xoaBang);
  nutChamDiem.addEventListener("click", aiChamDiem);
  nutDongPopupEl.addEventListener("click", dongPopupKetQua);
  nenPopupKetQuaEl.addEventListener("click", dongPopupKetQua);
  popupKetQuaEl.addEventListener("click", dongPopupKetQua);
  doDayButEl.addEventListener("input", (event) => {
    doDayBut = Number(event.target.value);
    context.lineWidth = doDayBut;
    hienThiDoDayEl.textContent = String(doDayBut);
  });
  cacNutMau.forEach((nutMau) => {
    nutMau.addEventListener("click", () => {
      mauBut = nutMau.dataset.mau;
      context.strokeStyle = mauBut;

      cacNutMau.forEach((nut) => nut.classList.remove("dang-chon"));
      nutMau.classList.add("dang-chon");
    });
  });
}

function khoiTaoTroChoi() {
  veNenTrang();
  khoiTaoButVe();
  capNhatBangBaoCaoTheoSo();
  capNhatNhiemVuMoi();
  ganSuKien();
  taiModelAI();
}

khoiTaoTroChoi();
