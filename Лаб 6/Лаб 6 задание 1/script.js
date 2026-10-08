"use strict";

const shopInput = document.querySelector("#shop-input");
const shopAdd = document.querySelector("#shop-add");
const shopList = document.querySelector("#shop-list");
const shopMessage = document.querySelector("#shop-message");

function addShopItem() {
  const text = shopInput.value.trim();
  if (text === "") {
    shopMessage.textContent = "Введите название товара.";
    return;
  }
  shopMessage.textContent = "";

  const li = document.createElement("li");
  li.textContent = text;
  li.setAttribute("title", "Нажмите, чтобы отметить");
  shopList.append(li);

  shopInput.value = "";
  shopInput.focus();
}

shopAdd.addEventListener("click", addShopItem);

shopInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addShopItem();
});


shopList.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (li) li.classList.toggle("done");
});
