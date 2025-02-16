function showNotification(message, duration) {
            Toastify({
                text: message,
                duration: duration, // Durasi notifikasi (dalam milidetik)
                gravity: 'top', // Menentukan posisi notifikasi ('top', 'bottom', 'left', atau 'right')
                position: 'center', // Menentukan posisi horizontal notifikasi ('left', 'center', atau 'right')
                style: {
                    background: 'white', // Warna latar belakang notifikasi
                    borderRadius : '15px',
                    padding :'10px',
                    border : '0.5px solid',
                    position : 'fixed',
                    width : '95vw',
                    margin : '10px'
                },
                stopOnFocus: true // Menghentikan notifikasi jika fokus pada halaman web
            }).showToast();
        }

var TokenIdUser = 'frigia-27-02-2025';
// guest book send
const kirimPesan = async () => {
    let nama = document.getElementById('formnama').value;
    let hadir = document.getElementById('hadiran').value;
    let komentar = document.getElementById('formpesan').value;
    if (nama.length == 0) {
      console.log('nama tidak boleh kosong');
        showNotification('nama tidak boleh kosong', 2000);
        return;
    }

    if (nama.length >= 35) {
        showNotification('panjangan nama maksimal 35', 2000);
        return;
    }

    if (hadir == 0) {
        showNotification('silahkan pilih kehadiran', 2000);
        return;
    }

    if (komentar.length == 0) {
        showNotification('pesan tidak boleh kosong', 2000);
        return;
    }

    document.getElementById('formnama').disabled = true;
    document.getElementById('hadiran').disabled = true;
    document.getElementById('formpesan').disabled = true;

    document.getElementById('guestbook-form').disabled = true;
    let tmp = document.getElementById('guestbook-form').innerHTML;
    document.getElementById('guestbook-form').innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;

    const commentsRef = firebase.database().ref(TokenIdUser+'/guestbook');

    try {
      await commentsRef.push({
        name: nama,
        kehadiran: hadir == 1,
        message: komentar,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      // Komentar berhasil terkirim, lakukan tindakan sukses di sini
      resetUcapan();
      showNotification('success', 2000);
    }
    catch (error) {
      // Terjadi kesalahan saat mengirim komentar, lakukan penanganan kesalahan di sini
      resetUcapan();
      showNotification(error.message, 2000);
    }

    document.getElementById('formnama').disabled = false;
    document.getElementById('hadiran').disabled = false;
    document.getElementById('formpesan').disabled = false;
    document.getElementById('guestbook-form').disabled = false;
    document.getElementById('guestbook-form').innerHTML = tmp;
};

const guestCard = (data, key) => {
    const DIV = document.createElement('div');
    DIV.classList.add('mb-3');
    DIV.innerHTML = `
    <div class="card-body bg-light shadow p-3 m-0 rounded-4" id="${key}">
        <div class="d-flex flex-wrap justify-content-between align-items-center">
            <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                <strong class="me-1">${escapeHtml(data.name)}</strong><i class="fa-solid ${data.kehadiran ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>
            </p>
            <i class="fa-solid fa-circle-times"></i><small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${hitungWaktuPengiriman(data.timestamp)}</small>
        </div>
        <hr class="text-dark my-1">
        <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${escapeHtml(data.message)}</p>
        
    </div>`;
    return DIV;
};

/*<div class="d-flex flex-wrap justify-content-between align-items-center">
            <button style="font-size: 0.8rem;" onclick="balasan(this)" data-uuid="${key}" class="btn btn-sm btn-outline-dark rounded-3 py-0">Balas</button>
        </div>

        ${guestInnerCard(key)}*/

const guestInnerCard = (key) => {
    // Menggunakan forEach untuk mengiterasi melalui hasil snapshot
    const commentsRef = firebase.database().ref(TokenIdUser+'/guestbook/'+ key +'/comments');
   let result = '';


    commentsRef.once("value", function(snapshot) {

        if (!snapshot.exists()) {
          return;
        }

        snapshot.forEach(function(childSnapshot) {
          // Mengambil data dari childSnapshot
          var data = childSnapshot.val();
          var keyChild = childSnapshot.key;

          result += `
            <div class="card-body border-start bg-light py-2 ps-2 pe-0 my-2 ms-2 me-0" id="$keyChild}">
                <div class="d-flex flex-wrap justify-content-between align-items-center">
                    <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                        <strong>${data.name}</strong>
                    </p>
                    <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${hitungWaktuPengiriman(data.timestamp)}</small>
                </div>
                <hr class="text-dark my-1">
                <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${data.message}</p>
                <div class="d-flex flex-wrap justify-content-between align-items-center">
                    <button style="font-size: 0.8rem;" onclick="balasan(this)" data-uuid="${keyChild}" class="btn btn-sm btn-outline-dark rounded-3 py-0">Balas</button>
                </div>
            </div>`;
        });
    });


    return result;
}


// Firebase database reference
var guestbookRef = firebase.database().ref(TokenIdUser+"/guestbook");

// Output element
var outputElement = document.getElementById("daftarucapan");

// Function to display guestbook entries
guestbookRef.on("child_added", function(data) {
  var guestbookEntry = data.val();
  var key = data.key;
  var guestCardElement = guestCard(guestbookEntry, key);
  outputElement.appendChild(guestCardElement);

  displayUpdateGuest();
});

// Check if there are no messages
function displayUpdateGuest(){
  guestbookRef.once("value", function(snapshot) {

      outputElement.innerHTML = '';
      var count = snapshot.numChildren();
      var countHadir = 0;
      var countTidakHadir = 0;
      allEntries = [];

      document.querySelector('#comments').innerHTML = count + ' Comments';

    if (!snapshot.exists()) {
      var noMessageDiv = document.createElement("div");
      noMessageDiv.classList.add("text-center", "mt-3", "font-weight-bold");
      noMessageDiv.textContent = "Tidak ada yang memberi ucapan.";
      outputElement.appendChild(noMessageDiv);
    }else{

      snapshot.forEach(function(snapshot){

        var guestbookEntry = snapshot.val();
        var key = snapshot.key;
        var guestCardElement = guestCard(guestbookEntry, key);


        var commentData = {
          key: key,
          value: guestbookEntry
        };

        allEntries.push(commentData);

        if(guestbookEntry.kehadiran){
          countHadir++;
        }else {
          countTidakHadir++;
        }
        //outputElement.appendChild(guestCardElement);


      });

      renderPage(currentPage);
    }

     document.querySelector('#hadir').innerHTML = countHadir + '<br>hadir';
     document.querySelector('#tidakHadir').innerHTML = countTidakHadir + '<br>Tidak hadir';

  });
}

displayUpdateGuest();

// Previous button event listener
var prevButton = document.getElementById("prevButton");
prevButton.addEventListener("click", prevPage);

// Next button event listener
var nextButton = document.getElementById("nextButton");
nextButton.addEventListener("click", nextPage);

// Function to reset form fields
function resetUcapan() {
  document.getElementById("formnama").value = null;
  document.getElementById("hadiran").value = "0";
  document.getElementById("formpesan").value = null;
}

// Fungsi untuk menghitung waktu pengiriman berdasarkan timestamp
function hitungWaktuPengiriman(timestamp) {
  // Mendapatkan waktu saat ini dalam milidetik
  const waktuSekarang = new Date().getTime();
  
  // Mendapatkan selisih waktu dalam milidetik
  const selisihWaktu = waktuSekarang - timestamp;

  const detik = Math.floor(selisihWaktu / 1000);
  const menit = Math.floor(detik / 60);
  const jam = Math.floor(menit / 60);
  const hari = Math.floor(jam / 24);
  const minggu = Math.floor(hari / 7);
  const bulan = Math.floor(minggu / 4);
  const tahun = Math.floor(minggu / 52);

  // Logika untuk menghasilkan format waktu yang sesuai
  if (detik < 10) {
    return 'Baru saja';
  } else if (detik < 60) {
    return `${detik} detik yang lalu`;
  } else if (menit < 60) {
    return `${menit} menit yang lalu`;
  } else if (jam < 24) {
    return `${jam} jam yang lalu`;
  } else if (hari < 7) {
    return `${hari} hari yang lalu`;
  } else if (minggu < 4) {
    return `${minggu} minggu yang lalu`;
  } else if (bulan < 12) {
    return `${bulan} bulan yang lalu`;
  } else {
    return `${tahun} tahun yang lalu`;
  }
}

function scrollToElement(elementId) {
  var element = document.getElementById(elementId);
  if (element) {
    // Scroll halus ke elemen
    window.scrollTo({
      behavior: 'smooth', // Membuat scroll menjadi halus
      top: element.offsetTop, // Menggulir ke posisi elemen
    });
  }
}

var currentPage = 1; // Halaman saat ini
var itemsPerPage = 3; // Jumlah item per halaman

var allEntries = [];

// Fungsi untuk menampilkan halaman berdasarkan nomor halaman
function renderPage(pageNumber) {
  var startIndex = (pageNumber - 1) * itemsPerPage;
  var endIndex = startIndex + itemsPerPage;
  var totalPages = Math.ceil(allEntries.length / itemsPerPage);
  document.querySelector('#page').innerHTML = currentPage +'';

  if (endIndex > allEntries.length) {
    endIndex = allEntries.length;
  }

  var currentPageEntries = allEntries.slice(startIndex, endIndex);

  if(allEntries.length > endIndex){
      document.querySelector('#next').classList.remove('disabled');
  }else {
      document.querySelector('#next').classList.add('disabled');
  }

  if(currentPage > 1){
      document.querySelector('#previous').classList.remove('disabled');
  }else {
      document.querySelector('#previous').classList.add('disabled');
  }

  outputElement.innerHTML ='';

  // Tampilkan currentPageEntries ke dalam UI
  currentPageEntries.forEach(function(snapshot) {
    var commentKey = snapshot.key; // Kunci (key) dari entri
    var commentValue = snapshot.value; // Nilai (value) dari entri

    var guestCardElement = guestCard(commentValue, commentKey);
    outputElement.appendChild(guestCardElement);
  });

  // Cek apakah currentPage adalah halaman terakhir
  if (currentPage === totalPages) {
    document.querySelector('#next').classList.add('disabled');
  }
}

// Fungsi untuk memuat halaman berikutnya
function nextPage() {
  currentPage++;
  renderPage(currentPage);
}

// Fungsi untuk memuat halaman sebelumnya
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderPage(currentPage);
  }
}
