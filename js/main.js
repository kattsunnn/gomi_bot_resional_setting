const CSV_FILE_PATH = './R8.1.1～R8.3.31.csv'; 
const MY_LIFF_ID = '2009167903-NEWkAfll';

let csvData = [];
const select1 = document.getElementById('area1');
const select2 = document.getElementById('area2');
const select3 = document.getElementById('area3');
const saveBtn = document.getElementById('saveBtn');

window.onload = async function() {
    try {
        await liff.init({ liffId: MY_LIFF_ID });
        await loadCSV();
    } catch (e) {
        console.error(e);
    }
};

async function loadCSV() {
    const response = await fetch(CSV_FILE_PATH);
    
    if (!response.ok) {
        throw new Error(`CSVが見つかりません (Status: ${response.status})`);
    }

    const text = await response.text();
    parseCSV(text);
    initArea1();
    
    select1.innerHTML = '<option value="">選択してください</option>';
    updateSelect(select1, getUniqueValues('area1'));
}

function parseCSV(text) {

    const lines = text.trim().split(/\r\n|\n/);
    const headers = lines[0].split(',');

    // ヘッダー位置の特定
    const idx1 = headers.findIndex(h => h.includes('地区1'));
    const idx2 = headers.findIndex(h => h.includes('地区2'));
    const idx3 = headers.findIndex(h => h.includes('地区3'));

    if (idx1 === -1) throw new Error("CSVに「地区1」列がありません");

    csvData = lines.slice(1).map(line => {
        const row = line.split(',');
        if (row.length < headers.length) return null;
        return {
            area1: row[idx1] ? row[idx1].trim() : "",
            area2: row[idx2] ? row[idx2].trim() : "",
            area3: row[idx3] ? row[idx3].trim() : ""
        };
    }).filter(item => item !== null);
}

function initArea1() {
    const unique = getUniqueValues('area1');
    updateSelect(select1, unique);
}

function getUniqueValues(key) {
    return [...new Set(csvData.map(d => d[key]).filter(v => v))].sort();
}

// 地区1 変更時
select1.addEventListener('change', function() {
    const val1 = this.value;
    resetSelect(select2, "地区2を選択");
    resetSelect(select3, "地区3を選択");
    saveBtn.disabled = true;

    if (!val1) return;

    // 地区2の候補を絞り込み
    const filtered = csvData.filter(d => d.area1 === val1);
    const unique2 = [...new Set(filtered.map(d => d.area2).filter(v => v))].sort();

    if (unique2.length > 0) {
        updateSelect(select2, unique2);
        select2.disabled = false;
    } else {
        // 地区2がない場合 -> 「なし」として完了
        setNoneOption(select2);
        setNoneOption(select3);
        saveBtn.disabled = false;
    }
});

// 地区2 変更時
select2.addEventListener('change', function() {
    const val1 = select1.value;
    const val2 = this.value;
    resetSelect(select3, "地区3を選択");
    saveBtn.disabled = true;

    if (!val2) return;

    // 地区3の候補を絞り込み
    const filtered = csvData.filter(d => d.area1 === val1 && d.area2 === val2);
    const unique3 = [...new Set(filtered.map(d => d.area3).filter(v => v))].sort();

    if (unique3.length > 0) {
        updateSelect(select3, unique3);
        select3.disabled = false;
    } else {
        // 地区3がない場合 -> 「なし」として完了
        setNoneOption(select3);
        saveBtn.disabled = false;
    }
});

// 地区3 変更時
select3.addEventListener('change', function() {
    if (this.value) {
        saveBtn.disabled = false;
    } else {
        saveBtn.disabled = true;
    }
});

// --- 共通関数 ---

function updateSelect(el, items) {
    // 先頭のoption以外を削除
    while (el.options.length > 1) { el.remove(1); }
    
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        el.appendChild(opt);
    });
}

function resetSelect(el, defaultText) {
    el.innerHTML = `<option value="">${defaultText}</option>`;
    el.disabled = true;
}

function setNoneOption(el) {
    el.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = "なし";
    opt.textContent = "なし";
    el.appendChild(opt);
    el.disabled = false;
}

async function submitData() {
    const result = {
        area1: select1.value,
        area2: select2.value === "なし" ? "" : select2.value,
        area3: select3.value === "なし" ? "" : select3.value
    };
    
    const messageText  = `${result.area1},${result.area2},${result.area3}`
    try {
        await liff.sendMessages([
            {
                type: 'text',
                text: messageText
            }
        ]);
        
        liff.closeWindow();
    } catch (error) {
        alert("送信に失敗しました: " + error);
        console.error("LIFF sendMessages Error:", error);
    }
}

const areaSearch = document.getElementById('areaSearch');

areaSearch.addEventListener('input', function() {
    const keyword = this.value; // 入力された文字

    // 全ての地区1リストから、キーワードを含むものだけを抽出
    const allUniqueArea1 = getUniqueValues('area1');
    const filteredArea1 = allUniqueArea1.filter(area => area.includes(keyword));

    updateSelect(select1, filteredArea1);
    resetSelect(select2, "地区2を選択");
    resetSelect(select3, "地区3を選択");
    
    if (filteredArea1.length === 1) {
        select1.value = filteredArea1[0];
        select1.dispatchEvent(new Event('change')); // 連動処理をキック
    }
});
