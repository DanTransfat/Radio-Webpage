const scrollWrapper = document.querySelector('.upcomingsongs');
const scrollContainer = document.querySelector('.scrollcontainer');

function createImage(){
    const img = document.createElement('img');
    img.src = 'https://raw.githubusercontent.com/edtton/RadioStation/main/template.jpg';
    return img; 
}

function atEnd(){
    return scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth; 
}

scrollWrapper.addEventListener('scroll', () => {
    if(atEnd()){
        const newImg = createImage(); 
        scrollContainer.appendChild(newImg); 
    }
});
