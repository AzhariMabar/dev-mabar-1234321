const audio = (() => {
    let instance = null;

    let createOrGet = () => {
        if (instance instanceof HTMLAudioElement) {
            return instance;
        }

        instance = new Audio();
        instance.autoplay = true;
        instance.src = document.getElementById('tombol-musik').getAttribute('data-url');
        instance.load();
        instance.currentTime = 0;
        instance.volume = 1;
        instance.muted = false;
        instance.loop = true;

        return instance;
    }

    return {
        play: () => {
            createOrGet().play();
        },
        pause: () => {
            createOrGet().pause();
        }
    };
})();

const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const salin = (btn, msg = null) => {
    navigator.clipboard.writeText(btn.getAttribute('data-nomer'));
    let tmp = btn.innerHTML;
    btn.innerHTML = msg ?? 'Tersalin';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = tmp;
        btn.disabled = false;
        btn.focus();
    }, 1500);
};

const timer = () => {
    let countDownDate = (new Date(document.getElementById('tampilan-waktu').getAttribute('data-waktu').replace(' ', 'T'))).getTime();
    let time = null;
    let distance = null;

    time = setInterval(() => {
        distance = countDownDate - (new Date()).getTime();

        if (distance < 0) {
            clearInterval(time);
            time = null;
            return;
        }

        document.getElementById('hari').innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        document.getElementById('jam').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        document.getElementById('menit').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('detik').innerText = Math.floor((distance % (1000 * 60)) / 1000);
    }, 1000);
};

const buka = async () => {
    document.getElementById('tombol-musik').style.display = 'block';
    audio.play();
    AOS.init();
    scrollToTop();
};

const play = (btn) => {
    if (btn.getAttribute('data-status').toString() != 'true') {
        btn.setAttribute('data-status', 'true');
        audio.play();
        btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
    } else {
        btn.setAttribute('data-status', 'false');
        audio.pause();
        btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
    }
};

const resetForm = () => {
    document.getElementById('guestbook-form').style.display = 'block';
    document.getElementById('hadiran').style.display = 'block';
    document.getElementById('labelhadir').style.display = 'block';
    document.getElementById('batal').style.display = 'none';
    document.getElementById('kirimbalasan').style.display = 'none';
    document.getElementById('idbalasan').value = null;
    document.getElementById('balasan').innerHTML = null;
    document.getElementById('formnama').value = null;
    document.getElementById('hadiran').value = 0;
    document.getElementById('formpesan').value = null;
};

const parseRequest = (method, token = null, body = null) => {
    let req = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        req.headers['Authorization'] = 'Bearer ' + token;
    }

    if (body) {
        req.body = JSON.stringify(body);
    }

    return req;
};

/*const getUrl = (optional = null) => {
    let url = document.querySelector('body').getAttribute('data-url');

    if (url.slice(-1) == '/') {
        url = url.slice(0, -1);
    }

    if (optional) {
        return url + optional;
    }

    return url;
};*/

const balasan = async (button, msg = null) => {
    button.disabled = true;
    let tmp = button.innerText;
    button.innerText = msg ?? 'Loading...';

    let id = button.getAttribute('data-uuid').toString();

    const BALAS = document.getElementById('balasan');
    BALAS.innerHTML = renderLoading(1);
    document.getElementById('hadiran').style.display = 'none';
    document.getElementById('labelhadir').style.display = 'none';

    const commentsRef = firebase.database().ref(TokenIdUser+'/guestbook/' +id);

    await commentsRef.once("value", function(snapshot){
        if (!snapshot.exists()) {
            return;
        }
        document.getElementById('guestbook-form').style.display = 'none';
        document.getElementById('batal').style.display = 'block';
        document.getElementById('kirimbalasan').style.display = 'block';
        document.getElementById('idbalasan').value = id;

        BALAS.innerHTML = `
        <div class="card-body bg-light shadow p-3 my-2 rounded-4">
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                    <strong>${snapshot.val().name}</strong>
                </p>
                <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${hitungWaktuPengiriman(snapshot.val().timestamp)}</small>
            </div>
            <hr class="text-dark my-1">
            <p class="text-dark m-0 p-0" style="white-space: pre-line">${snapshot.val().message}</p>
        </div>`;
    });

    document.getElementById('ucapan').scrollIntoView({ behavior: 'smooth' });
    button.disabled = false;
    button.innerText = tmp;
};

const kirimBalasan = async () => {
    let nama = document.getElementById('formnama').value;
    let komentar = document.getElementById('formpesan').value;
    let id = document.getElementById('idbalasan').value;


    if (nama.length == 0) {
        showNotification('nama tidak boleh kosong',2000);
        return;
    }

    if (nama.length >= 35) {
        showNotification('panjangan nama maksimal 35',2000);
        return;
    }

    if (komentar.length == 0) {
        showNotification('pesan tidak boleh kosong',2000);
        return;
    }

    document.getElementById('formnama').disabled = true;
    document.getElementById('formpesan').disabled = true;

    document.getElementById('batal').disabled = true;
    document.getElementById('kirimbalasan').disabled = true;
    let tmp = document.getElementById('kirimbalasan').innerHTML;
    document.getElementById('kirimbalasan').innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;

    let isSuccess = false;

    const commentsRef = firebase.database().ref(TokenIdUser+'/guestbook/'+id +'/comments');

    try {
      await commentsRef.push({
        name: nama,
        id: id,
        message: komentar,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      // Komentar berhasil terkirim, lakukan tindakan sukses di sini
      resetUcapan();
      showNotification('success', 2000);
      isSuccess = true;
    }
    catch (error) {
      // Terjadi kesalahan saat mengirim komentar, lakukan penanganan kesalahan di sini
      resetUcapan();
      showNotification(error.message, 2000);
    }
    /*if (isSuccess) {
        await ucapan();
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        resetUcapan();
    }*/

    document.getElementById('batal').disabled = false;
    document.getElementById('kirimbalasan').disabled = false;
    document.getElementById('kirimbalasan').innerHTML = tmp;
    document.getElementById('formnama').disabled = false;
    document.getElementById('formpesan').disabled = false;

    resetForm();
};

const getTempLike = (key = null) => {
    if (!localStorage.getItem('likes')) {
        localStorage.setItem('likes', JSON.stringify({}));
    }

    if (key) {
        return JSON.parse(localStorage.getItem('likes'))[key];
    }

    return JSON.parse(localStorage.getItem('likes'));
};

const setTempLike = (key, value) => {
    let storage = getTempLike();
    storage[key] = value;
    localStorage.setItem('likes', JSON.stringify(storage));
};

const removeTempLike = (key) => {
    let storage = getTempLike();
    delete storage[key];
    localStorage.setItem('likes', JSON.stringify(storage));
};

const inTempLike = (key) => {
    return Object.keys(getTempLike()).includes(key);
};

/*const like = async (button) => {
    let token = localStorage.getItem('token') ?? '';
    let id = button.getAttribute('data-uuid');

    if (token.length == 0) {
        alert('Terdapat kesalahan, token kosong !');
        window.location.reload();
        return;
    }

    let heart = button.firstElementChild.lastElementChild;
    let info = button.firstElementChild.firstElementChild;

    button.disabled = true;
    info.innerText = 'Loading..';

    if (inTempLike(id)) {
        await fetch(
            getUrl('/api/comment/' + getTempLike(id)),
            parseRequest('PATCH', token))
            .then((res) => res.json())
            .then((res) => {
                if (res.error.length != 0) {
                    if (res.error[0] == 'Expired token') {
                        alert('Terdapat kesalahan, token expired !');
                        window.location.reload();
                        return;
                    }

                    alert(res.error[0]);
                }

                if (res.data.status) {
                    removeTempLike(id);

                    heart.classList.remove('fa-solid', 'text-danger');
                    heart.classList.add('fa-regular');

                    info.setAttribute('data-suka', (parseInt(info.getAttribute('data-suka')) - 1).toString())
                    info.innerText = info.getAttribute('data-suka') + ' suka';
                }
            })
            .catch((err) => {
                alert(err);
            });

    } else {
        await fetch(
            getUrl('/api/comment/' + id),
            parseRequest('POST', token))
            .then((res) => res.json())
            .then((res) => {
                if (res.error.length != 0) {
                    if (res.error[0] == 'Expired token') {
                        alert('Terdapat kesalahan, token expired !');
                        window.location.reload();
                        return;
                    }

                    alert(res.error[0]);
                }

                if (res.code == 201) {
                    setTempLike(id, res.data.uuid);

                    heart.classList.remove('fa-regular');
                    heart.classList.add('fa-solid', 'text-danger');

                    info.setAttribute('data-suka', (parseInt(info.getAttribute('data-suka')) + 1).toString())
                    info.innerText = info.getAttribute('data-suka') + ' suka';
                }
            })
            .catch((err) => {
                alert(err);
            });
    }

    button.disabled = false;
};*/

const innerCard = (comment) => {
    let result = '';

    comment.forEach((data) => {
        result += `
        <div class="card-body border-start bg-light py-2 ps-2 pe-0 my-2 ms-2 me-0" id="${data.uuid}">
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                    <strong>${escapeHtml(data.nama)}</strong>
                </p>
                <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${data.created_at}</small>
            </div>
            <hr class="text-dark my-1">
            <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${escapeHtml(data.komentar)}</p>
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <button style="font-size: 0.8rem;" onclick="balasan(this)" data-uuid="${data.uuid}" class="btn btn-sm btn-outline-dark rounded-3 py-0">Balas</button>
                <button style="font-size: 0.8rem;" onclick="like(this)" data-uuid="${data.uuid}" class="btn btn-sm btn-outline-dark rounded-2 py-0 px-0">
                    <div class="d-flex justify-content-start align-items-center">
                        <p class="my-0 mx-1" data-suka="${data.like.love}">${data.like.love} suka</p>
                        <i class="py-1 me-1 p-0 ${inTempLike(data.uuid) ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
                    </div>
                </button>
            </div>
            ${innerCard(data.comments)}
        </div>`;
    });

    return result;
};

const renderCard = (data) => {
    const DIV = document.createElement('div');
    DIV.classList.add('mb-3');
    DIV.innerHTML = `
    <div class="card-body bg-light shadow p-3 m-0 rounded-4" id="${data.uuid}">
        <div class="d-flex flex-wrap justify-content-between align-items-center">
            <p class="text-dark text-truncate m-0 p-0" style="font-size: 0.95rem;">
                <strong class="me-1">${escapeHtml(data.nama)}</strong><i class="fa-solid ${data.hadir ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>
            </p>
            <small class="text-dark m-0 p-0" style="font-size: 0.75rem;">${data.created_at}</small>
        </div>
        <hr class="text-dark my-1">
        <p class="text-dark mt-0 mb-1 mx-0 p-0" style="white-space: pre-line">${escapeHtml(data.komentar)}</p>
        <div class="d-flex flex-wrap justify-content-between align-items-center">
            <button style="font-size: 0.8rem;" onclick="balasan(this)" data-uuid="${data.uuid}" class="btn btn-sm btn-outline-dark rounded-3 py-0">Balas</button>
            <button style="font-size: 0.8rem;" onclick="like(this)" data-uuid="${data.uuid}" class="btn btn-sm btn-outline-dark rounded-2 py-0 px-0">
                <div class="d-flex justify-content-start align-items-center">
                    <p class="my-0 mx-1" data-suka="${data.like.love}">${data.like.love} suka</p>
                    <i class="py-1 me-1 p-0 ${inTempLike(data.uuid) ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
                </div>
            </button>
        </div>
        ${innerCard(data.comments)}
    </div>`;
    return DIV;
};

const renderLoading = (num) => {
    let hasil = '';
    for (let index = 0; index < num; index++) {
        hasil += `
        <div class="mb-3">
            <div class="card-body bg-light shadow p-3 m-0 rounded-4">
                <div class="d-flex flex-wrap justify-content-between align-items-center placeholder-glow">
                    <span class="placeholder bg-secondary col-5"></span>
                    <span class="placeholder bg-secondary col-3"></span>
                </div>
                <hr class="text-dark my-1">
                <p class="card-text placeholder-glow">
                    <span class="placeholder bg-secondary col-6"></span>
                    <span class="placeholder bg-secondary col-5"></span>
                    <span class="placeholder bg-secondary col-12"></span>
                </p>
            </div>
        </div>`;
    }

    return hasil;
};

const pagination = (() => {

    const perPage = 10;
    let pageNow = 0;
    let resultData = 0;

    let disabledPrevious = () => {
        document.getElementById('previous').classList.add('disabled');
    };

    let disabledNext = () => {
        document.getElementById('next').classList.add('disabled');
    };

    let buttonAction = async (button) => {
        let tmp = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;
        await ucapan();
        document.getElementById('daftarucapan').scrollIntoView({ behavior: 'smooth' });
        button.disabled = false;
        button.innerHTML = tmp;
    };

    return {
        getPer: () => {
            return perPage;
        },
        getNext: () => {
            return pageNow;
        },
        reset: async () => {
            pageNow = 0;
            resultData = 0;
            await ucapan();
            document.getElementById('page').innerText = 1;
            document.getElementById('next').classList.remove('disabled');
            disabledPrevious();
        },
        setResultData: (len) => {
            resultData = len;
            if (resultData < perPage) {
                disabledNext();
            }
        },
        previous: async (button) => {
            if (pageNow < 0) {
                disabledPrevious();
            } else {
                document.getElementById('page').innerText = parseInt(document.getElementById('page').innerText) - 1;
                pageNow -= perPage;
                disabledNext();
                await buttonAction(button);
                document.getElementById('next').classList.remove('disabled');
                if (pageNow <= 0) {
                    disabledPrevious();
                }
            }
        },
        next: async (button) => {
            if (resultData < perPage) {
                disabledNext();
            } else {
                document.getElementById('page').innerText = parseInt(document.getElementById('page').innerText) + 1;
                pageNow += perPage;
                disabledPrevious();
                await buttonAction(button);
                document.getElementById('previous').classList.remove('disabled');
            }
        }
    };
})();

const ucapan = async () => {
    const UCAPAN = document.getElementById('daftarucapan');
    UCAPAN.innerHTML = renderLoading(pagination.getPer());
    let token = localStorage.getItem('token') ?? '';

    if (token.length == 0) {
        alert('Terdapat kesalahan, token kosong !');
        window.location.reload();
        return;
    }

    await fetch(getUrl(`/api/comment?per=${pagination.getPer()}&next=${pagination.getNext()}`), parseRequest('GET', token))
        .then((res) => res.json())
        .then((res) => {
            if (res.code == 200) {
                UCAPAN.innerHTML = null;
                res.data.forEach((data) => UCAPAN.appendChild(renderCard(data)));
                pagination.setResultData(res.data.length);

                if (res.data.length == 0) {
                    UCAPAN.innerHTML = `<div class="h6 text-center">Tidak ada data</div>`;
                }
            }

            if (res.error.length != 0) {
                if (res.error[0] == 'Expired token') {
                    alert('Terdapat kesalahan, token expired !');
                    window.location.reload();
                    return;
                }

                alert(res.error[0]);
            }
        })
        .catch((err) => alert(err));
};

const kirim = async () => {
    let nama = document.getElementById('formnama').value;
    let hadir = document.getElementById('hadiran').value;
    let komentar = document.getElementById('formpesan').value;
    let token = localStorage.getItem('token') ?? '';

    if (token.length == 0) {
        alert('Terdapat kesalahan, token kosong !');
        window.location.reload();
        return;
    }

    if (nama.length == 0) {
        alert('nama tidak boleh kosong');
        return;
    }

    if (nama.length >= 35) {
        alert('panjangan nama maksimal 35');
        return;
    }

    if (hadir == 0) {
        alert('silahkan pilih kehadiran');
        return;
    }

    if (komentar.length == 0) {
        alert('pesan tidak boleh kosong');
        return;
    }

    document.getElementById('formnama').disabled = true;
    document.getElementById('hadiran').disabled = true;
    document.getElementById('formpesan').disabled = true;

    document.getElementById('kirim').disabled = true;
    let tmp = document.getElementById('kirim').innerHTML;
    document.getElementById('kirim').innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Loading...`;

    await fetch(
        getUrl('/api/comment'),
        parseRequest('POST', token, {
            nama: nama,
            hadir: hadir == 1,
            komentar: komentar
        }))
        .then((res) => res.json())
        .then((res) => {
            if (res.code == 201) {
                resetForm();
                pagination.reset();
            }

            if (res.error.length != 0) {
                if (res.error[0] == 'Expired token') {
                    alert('Terdapat kesalahan, token expired !');
                    window.location.reload();
                    return;
                }

                alert(res.error[0]);
            }
        })
        .catch((err) => {
            resetForm();
            alert(err);
        });

    document.getElementById('formnama').disabled = false;
    document.getElementById('hadiran').disabled = false;
    document.getElementById('formpesan').disabled = false;
    document.getElementById('kirim').disabled = false;
    document.getElementById('kirim').innerHTML = tmp;
};


window.addEventListener('load', () => {
    let name = (new URLSearchParams(window.location.search)).get('to') ?? '';
    document.getElementById('formnama').value = name;
    document.getElementById('namatamu').innerHTML = name ? 'Kepada Bpk/Ibu/Sdr<br>'+name : '';

}, false);

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Untuk animasi pelan-pelan
  });
}

