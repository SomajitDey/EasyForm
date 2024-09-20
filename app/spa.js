// Utilities for turning any html into a Single Page Application (SPA).
// Public API identifiers (i.e. names of exposed vars, consts and funcs) are prefixed with 'spa'.
// Block scopes are to hide the private elements.

const spaHomePageID = document.querySelector(".spa-page").id; // Assuming first spa-page class is the home / hero page
let spaCurrentPageID = spaHomePageID;

function spaShow(id) {
    document.getElementById(id).style.display = 'block';
}

function spaHide(id) {
    document.getElementById(id).style.display = 'none';
}

function spaToggle(id) {
    let x = document.getElementById(id);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function spaGoTo(id) {
    spaHide(spaCurrentPageID);
    spaShow(id);
    spaCurrentPageID = id;
    sessionStorage.setItem("spaCurrentPageID", id);
}

function spaRestore(){
    const leftAt = sessionStorage.getItem("spaCurrentPageID"); // Start where left off (useful upon page reload)
    if (leftAt) { spaGoTo(leftAt);} // Do nothing on fresh load
}

function spaTop(){
    document.getElementById(spaCurrentPageID).scrollIntoView();
}

function spaBottom(){
    document.getElementById(spaCurrentPageID).scrollIntoView(false);
}

{
    const pages = document.getElementsByClassName("spa-page");

    for (let el of pages) {
        el.style.display = 'none';
    }
}

spaShow(spaHomePageID); // Can be overridden with <body onload="spaRestore();"> in the html to persist page-view upon reload
