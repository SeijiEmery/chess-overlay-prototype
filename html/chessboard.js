
var cb = [
    'R','H','B','K','Q','B','H','R',
    'P','P','P','P','P','P','P','P',
    ' ',' ',' ',' ',' ',' ',' ',' ',
    ' ',' ',' ',' ',' ',' ',' ',' ',
    ' ',' ',' ',' ',' ',' ',' ',' ',
    ' ',' ',' ',' ',' ',' ',' ',' ',
    'p','p','p','p','p','p','p','p',
    'r','h','b','k','q','b','h','r',
]
var threat = [
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
]

function init () {
    var canvas = document.getElementById("canvas");
    canvas.addEventListener("mousedown", onMouseDown, false);
    draw();
}

var prevXY = 0;
var prevPiece = 'R';

function onMouseDown (evt) {
    xy = getBoardPos(document.getElementById("canvas"), evt);
    // if (prevXY >= 0)
    //      cb[xy] = prevPiece;
    // if (xy >= 0)
    //       prevPiece = cb[xy];
    // prevXY = xy;

    if (cb[xy] == ' ')
        cb[xy] = 'P';
    else
        cb[xy] = ' ';

    draw();

    // window.alert("Mousedown: "+xy+" prevPiece: "+prevPiece+" cp:"+cb[xy]);
}

function updateThreat () {
    for (var i = 0; i < 64; ++i) {
        threat[i] = 0;
    }

    function isSameSide (x,y,side) {
        return side ?
            cb[x+y*8].toUpperCase() == cb[x+y*8] :
            cb[x+y*8].toLowerCase() == cb[x+y+8];
    }

    function paintCell (x,y) {
        if (x >= 0 && x <= 7 && y >= 0 && y <= 7)
            ++threat[x + y * 8];
    }
    function paintPawn (x,y,dir) {
        paintCell(x - 1, y + dir * 2);
        paintCell(x + 1, y + dir * 2);
        // if (x != 0) ++threat[x + (y+dir*2)*8 - 1];
        // if (x != 7) ++threat[x + (y+dir*2)*8 + 1];
    }
    function paintKnight (x,y,dir) {}
    function paintRook   (x,y,dir) {
        for (var i = x + 1; i <= 7; ++i) {
            paintCell(i, y);
            if (isSameSide(x,y,true)) {
                // threat[i+x*8] = 10;
                break;
            }
        }
        for (var i = x - 1; i >= 0; ++i) {
            paintCell(i, y);
            if (isSameSide(x,y,true))
                // threat[i+x*8] = 10;
                break;
        }
        for (var i = y + 1; y <= 7; ++i) {
            paintCell(x, i);
            if (isSameSide(x,y,true)) {
                break;
            }
        }
        for (var i = y - 1; y >= 0; ++i) {
            paintCell(x, i);
            if (isSameSide(x,y,true)) {
                break;
            }
        }
        // for (var i = 0; i < 8; ++i) {
        //     paintCell(i, y);
        //     paintCell(x, i);
        // }
        // threat[x + y * 8] -= 2;
    }
    function paintBishop (x,y,dir) {

    }
    function paintKing   (x,y,dir) {}

    for (var i = 0; i < 64; ++i) {
        x = i & 7;
        y = i >> 3;
        yy = i & 0x38;

        switch (cb[i]) {
            case 'K':
                paintKing(x,y,1);
                break;
            case 'Q':
                paintBishop(x,y,1);
                paintRook  (x,y,1);
                break;
            case 'R':
                paintRook(x,y,1);
                break;
            case 'B':
                paintBishop(x,y,1);
                break;
            case 'H': 
                paintKnight(x,y,1);
                break;
            case 'P':
                paintPawn(x,y,1);
                break;
            default:
        }
    }
}

function getUnicodeSymbol (chr_code) {
    switch (chr_code) {
        case 'K': return "♔";
        case 'Q': return "♕";
        case 'R': return "♖";
        case 'B': return "♗";
        case 'H': return "♘";
        case 'P': return "♙";

        case 'k': return "♚";
        case 'q': return "♛";
        case 'r': return "♜";
        case 'b': return "♝";
        case 'h': return "♞";
        case 'p': return "♟";
        default:  return '';
    }
}


// Board dimension variables
var bx = 40,  by = 10;         // offset
var bw = 380, bh = 380;        // board dimensions
var cw = bw / 8, ch = bh / 8;  // cell dimensions


function getBoardPos (canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    x = evt.clientX - rect.left;
    y = evt.clientY - rect.top;

    if (x <= bx || x >= bx + bh || 
        y <= by || y >= by + bh)
        return -1;

    cx = ((x - bx) / ch)|0;
    cy = ((x - by) / ch)|0;
    return cx + cy * 8;
}

function draw () {
    updateThreat();

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    // window.alert(ctx.font)
    ctx.font = "40px sans-serif";

    if (!canvas || !ctx)
        window.alert("No canvas support");

    

    // threat[10] = 1;
    // threat[12] = 4;
    // threat[16] = 3;

    function cellColor (background, threat) {
        if (threat != 0)
            return "rgb(255,"+(255-threat * 48)+","+(255-threat*48)+")";
            // return "rgb("+((255 - threat * 32)|0)+",0,0)";
        if (background)
            return "rgb(255,255,255)";
        return "rgb(0,0,0)";
    }

    colors = ["rgb(255,255,255)","rgb(0,0,0)"]
    for (var i = 0; i < 64; ++i) {
        x = i & 7;
        y = i >> 3;

        // var background = colors[(i+y)%2];
        // ctx.fillStyle = background;

        ctx.fillStyle = cellColor((i+y)%2, threat[i]);
        ctx.fillRect (bx + x * cw, by + y * ch, cw, ch);

        ctx.fillStyle = colors[(i+y)%2];
        ctx.fillText (cb[i],//getUnicodeSymbol(cb[i]),
            bx + x * cw + 10, by + y * ch + 40);
    }

}





