import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

let allShopItems = [];

window.openShop = async function () {

    const snapshot = await getDocs(collection(db, "shop"));
    allShopItems = [];
    
    const categories = new Set(["전체"]);

    snapshot.forEach((shopDoc) => {
        const item = shopDoc.data();
        allShopItems.push({
            id: shopDoc.id,
            ...item
        });
        if (item.category) {
            categories.add(item.category);
        }
    });

    let html = `
        <style>
            .search-container {
                display: flex;
                gap: 10px;
                margin-bottom: 24px;
                width: 100%;
                box-sizing: border-box;
            }
            .search-select {
                flex: 3;
                padding: 12px;
                border: 1px solid #e4e7eb;
                border-radius: 12px;
                font-size: 15px;
                outline: none;
                background-color: #f8f9fa;
                box-sizing: border-box;
            }
            .search-input {
                flex: 7; 
                padding: 12px 16px;
                border: 1px solid #e4e7eb;
                border-radius: 12px;
                font-size: 15px;
                outline: none;
                background-color: #f8f9fa;
                box-sizing: border-box;
                transition: all 0.2s;
            }
            .search-select:focus, .search-input:focus {
                border-color: #9b87f5;
                background-color: #fff;
                box-shadow: 0 0 0 3px rgba(155, 135, 245, 0.1);
            }

            .shop-table {
                width: 100%;
                border-collapse: collapse;
                border-radius: 12px;
                overflow: hidden;
            }
            .shop-table th {
    background-color: #9b87f5;
    color: white;
    font-weight: 600;
    padding: 14px 8px;
    font-size: 15px;
    text-align: center;
    vertical-align: middle;
}
.shop-table td {
    padding: 16px 8px;
    border-bottom: 1px solid #f1f2f6;
    text-align: center;
    vertical-align: middle;
            
            .row-sold-out {
                opacity: 0.45;
                background-color: #fdfefe;
            }
            
            .badge-sold-out {
                display: inline-block;
                background-color: #ff4757;
                color: white;
                font-size: 11px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 4px;
                margin-top: 5px;
            }


            .btn-buy {
    background: #6c5ce7;
    color: white;
    border: none;
    width: 64px;              
    height: 36px;              
    border-radius: 18px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
    transition: all 0.2s;
    
    display: inline-flex;       
    align-items: center;      
    justify-content: center;   
    white-space: nowrap;
    box-sizing: border-box;  
}
            
            .btn-buy.sold-out {
                background: #a4b0be !important;
                box-shadow: none !important;
                cursor: pointer;
            }
        </style>
        <div style="max-width: 600px; margin: 0 auto; padding: 10px; box-sizing: border-box;">
            <h1 style="text-align:center; color:#5f27cd; font-size:28px; margin-bottom:20px;">상점</h1>

            <div style="text-align:center; margin-bottom: 25px;">
                <button onclick="showMainPage()" style="padding: 10px 24px; background:#f1f2f6; border:none; border-radius:30px; font-weight:600; color:#57606f; cursor:pointer;">← 메인으로</button>
            </div>
            <div class="search-container">
                <select id="searchCategory" class="search-select" onchange="filterShopItems()">
    `;

    categories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });

    html += `
                </select>
                <input type="text" id="searchKeyword" class="search-input" placeholder="상품 이름 검색..." oninput="filterShopItems()">
            </div>

<table class="shop-table">
    <thead>
        <tr>
            <th style="width: 25%;">상품</th>
            <th style="width: 38%;">설명</th>
            <th style="width: 11%;">재고</th>
            <th style="width: 12%;">가격</th>
            <th style="width: 14%;"></th> <!-- 버튼 칸 -->
        </tr>
    </thead>
    <tbody id="shopTableBody">
    `;

    html += generateTableRows(allShopItems);

    html += `
                </tbody>
            </table>
        </div>
    `;

    document.getElementById("app").innerHTML = html;
};

function generateTableRows(items) {
    let rowsHtml = "";
    if (items.length === 0) {
        return `<tr><td colspan="5" style="text-align:center; color:gray; padding:30px;">검색된 상품이 없습니다.</td></tr>`;
    }

    items.forEach((item) => {
        const isSoldOut = item.stock === 0;

        rowsHtml += `
        <tr class="${isSoldOut ? 'row-sold-out' : ''}">
            <td>
                <b>${item.name}</b>
                ${isSoldOut ? '<br><span class="badge-sold-out">품절</span>' : ''}
            </td>
           <td style="color: #57606f; font-size:14px;">${item.description ?? "-"}</td>
            <td style="font-weight:600;">${item.stock == -1 ? "∞" : item.stock}</td>
            <td style="color: #2f3542; font-weight:600; white-space: nowrap;">${item.price}円</td>
            <td>
                <button 
                    onclick="buyItem('${item.id}')" 
                    class="btn-buy ${isSoldOut ? 'sold-out' : ''}">
                    ${isSoldOut ? '품절' : '구매'}
                </button>
            </td>
        </tr>
        `;
    });
    return rowsHtml;
}

window.filterShopItems = function() {
    const selectedCategory = document.getElementById("searchCategory").value;
    const keyword = document.getElementById("searchKeyword").value.toLowerCase().trim();

    const filtered = allShopItems.filter(item => {
        const matchesCategory = (selectedCategory === "전체") || (item.category === selectedCategory);
        const matchesKeyword = item.name.toLowerCase().includes(keyword);
        return matchesCategory && matchesKeyword;
    });

    document.getElementById("shopTableBody").innerHTML = generateTableRows(filtered);
};

window.buyItem = async function (itemId) {

    const itemRef = doc(db, "shop", itemId);
    const itemSnap = await getDoc(itemRef);
    const item = itemSnap.data();

    if(item.stock===0){
        alert("죄송합니다. 품절된 상품은 구매하실 수 없습니다.");
        return;
    }

    if (!confirm(`[${item.name}] 상품을 정말로 구매하시겠습니까?\n가격: ${item.price}円`)) {
        return; 
    }

    if (window.currentUser.money < item.price) {
        alert("보유금이 부족합니다.");
        return;
    }

    window.currentUser.money -= item.price;

    await updateDoc(doc(db, "users", window.currentUser.id), {
        money: window.currentUser.money
    });

    const inventoryId = `${window.currentUser.id}_${itemId}`;
    const inventoryRef = doc(db, "inventory", inventoryId);
    const inventorySnap = await getDoc(inventoryRef);

    if (inventorySnap.exists()) {
        await updateDoc(inventoryRef, {
            count: inventorySnap.data().count + 1
        });
    } else {
        await setDoc(inventoryRef, {
            userId: window.currentUser.id,
            itemId: itemId,
            name: item.name,
            count: 1
        });
    }

    if(item.stock>0){
        await updateDoc(itemRef,{
            stock:item.stock-1
        });
    }

    await window.addLog(
        "shop",
        `${item.name} 구매 (${item.price}円)`
    );

    alert(`${item.name}을(를) 구매했습니다.`);
    await window.openShop();
};