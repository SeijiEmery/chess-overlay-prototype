
// Player ids: PLAYER_1 = white, PLAYER_2 = black.
var PLAYER_1 = 0, PLAYER_2 = 1;

// Piece ids (enum)
var KING = 0, QUEEN = 1, ROOK = 2, BISHOP = 3, KNIGHT = 4, PAWN = 5;
var UNKNOWN_PIECE = 6;

// Board dimension + placement (absolute relative to canvas element).
var BX = 40, BY = 10;          // Board offset
var BW = 380, BH = 380;        // Board dimensions
var CW = BW / 8, CH = BH / 8;  // Cell dimensions

// Color utils
function Color (r, g, b) {
    this.r = r;
    this.b = b;
    this.g = g;
}
Color.prototype.toString = function () {
    return "rgb("+(this.r|0)+","+(this.g|0)+","+(this.b|0)+")";
}
var WHITE = new Color(255,255,255);
var BLACK = new Color(0,  0,  0  );
var RED   = new Color(255,0,  0  );

function assert (condition,msg) {
    if (!condition)
        throw "Assertion failed!";
}

function Piece (owner, piece, x, y) {
    this.owner = owner;
    this.type  = piece;
    this.x     = x;
    this.y     = y;
    assert(owner == PLAYER_1 || owner == PLAYER_2);
}
Piece.fromAscii = function (chr, x, y) {
    if (!chr || chr == ' ')
        return null;

    var owner = chr.toUpperCase() == chr ? PLAYER_1 : PLAYER_2;
    var piece;
    switch (chr.toUpperCase()) {
        case 'K': piece = KING;   break;
        case 'Q': piece = QUEEN;  break;
        case 'R': piece = ROOK;   break;
        case 'B': piece = BISHOP; break;
        case 'N': piece = KNIGHT; break;
        case 'P': piece = PAWN;   break;
        default:  piece = UNKNOWN_PIECE; break;
    }
    return new Piece(owner, piece, x, y);
}
var ASCII_CHESS_PIECES = [
    'K', 'Q', 'R', 'B', 'N', 'P',
    'k', 'q', 'r', 'b', 'n', 'p',
]
Piece.prototype.getAsciiSymbol = function () {
    return piece.owner == PLAYER_1 ?
        ASCII_CHESS_PIECES[piece.type] :
        ASCII_CHESS_PIECES[piece.type + 6];
}
var UNICODE_CHESS_PIECES = [ 
    "♔", "♕", "♖", "♗", "♘", "♙",
    "♚", "♛", "♜", "♝", "♞", "♟",
]
Piece.prototype.getUnicodeSymbol = function () {
    return this.owner == PLAYER_1 ?
        UNICODE_CHESS_PIECES[this.type] :
        UNICODE_CHESS_PIECES[this.type + 6];
}



function Player (id) {
    this.id = id;               // player id: PLAYER_1 | PLAYER_2
    this.pieces = new Array();  // list of pieces owned by this player
    this.threat = new Array();  // threat grid (transient)
    this.threat.length = 64;

    this.dir = this.id == PLAYER_1 ? 1 : -1;
}
Player.prototype.updateThreat = function (board) {
    var threat = this.threat;
    // var pieces = this.pieces;
    var dir    = this.dir;

    for (var i = 0; i < 64; ++i)
        this.threat[i] = 0;

    for (var i = this.pieces.length; i --> 0; ) {
        var piece = this.pieces[i];
        switch (piece.type) {
            case KING:   paintKing(piece); break;
            case QUEEN:  paintRook(piece), paintBishop(piece); break;
            case ROOK:   paintRook(piece); break;
            case BISHOP: paintBishop(piece); break;
            case KNIGHT: paintKnight(piece); break;
            case PAWN:   paintPawn(piece); break;
        }
    }
    function paintKing   (piece) {
        maybePaintCell(piece.x + 1, piece.y + 1);
        maybePaintCell(piece.x    , piece.y + 1);
        maybePaintCell(piece.x - 1, piece.y + 1);
        maybePaintCell(piece.x - 1, piece.y    );
        maybePaintCell(piece.x - 1, piece.y - 1);
        maybePaintCell(piece.x    , piece.y - 1);
        maybePaintCell(piece.x + 1, piece.y - 1);
        maybePaintCell(piece.x + 1, piece.y    );
    }
    function paintRook   (piece) {
        for (var x = piece.x+1; x <= 7; ++x) {
            paintCell(piece.x, piece.y);
            if (board.grid[x + (y << 3)]) break;
        }
        for (var x = piece.x-1; x >= 0; --x) {
            paintCell(piece.x, piece.y);
            if (board.grid[x + (y << 3)]) break;
        }
        for (var y = piece.y+1; y <= 7; ++y) {
            paintCell(piece.x, piece.y);
            if (board.grid[x + (y << 3)]) break;
        }
        for (var y = piece.y-1; y >= 0; --y) {
            paintCell(piece.x, piece.y);
            if (board.grid[x + (y << 3)]) break;
        }
    }
    function paintBishop (piece) {

    }
    function paintKnight (piece) {
        function paintDir (dx, dy) {
            maybePaintCell(piece.x + dx, piece.y + dy);
            maybePaintCell(piece.x - dx, piece.y + dy);
            maybePaintCell(piece.x - dx, piece.y - dy);
            maybePaintCell(piece.x + dx, piece.y - dy);
        }
        paintDir(1, 2);
        paintDir(2, 1);
    }
    function paintPawn   (piece) {
        if (piece.x >= 0) paintCell(piece.x-1, piece.y + dir * 2);
        if (piece.x <= 7) paintCell(piece.x+1, piece.y + dir * 2);
    }
    function maybePaintCell (x,y) {
        if (!(x < 0 || x > 7 || y < 0 || y > 7))
            paintCell(x, y);
    }
    function paintCell   (x,y) {
        ++threat[(x + (y << 3))];
    }
}


function Board () {
    this.grid = new Array();
    this.grid.length = 64;
    this.players = [
        new Player(PLAYER_1),
        new Player(PLAYER_2),
    ];
}
Board.prototype.updateThreat = function () {
    this.players[PLAYER_1].updateThreat(this);
    this.players[PLAYER_2].updateThreat(this);
    return this;
}
Board.prototype.setupInitial = function () {
    var board = [
        'R','N','B','K','Q','B','N','R',
        'P','P','P','P','P','P','P','P',
        ' ',' ',' ',' ',' ',' ',' ',' ',
        ' ',' ',' ',' ',' ',' ',' ',' ',
        ' ',' ',' ',' ',' ',' ',' ',' ',
        ' ',' ',' ',' ',' ',' ',' ',' ',
        'p','p','p','p','p','p','p','p',
        'r','n','b','k','q','b','n','r',
    ];

    // Reset board state
    this.grid.length = 0;
    this.grid.length = 64;
    this.players[PLAYER_1].pieces.length = 0;
    this.players[PLAYER_2].pieces.length = 0;

    for (var i = 0; i < 64; ++i) {
        var piece = Piece.fromAscii(board[i], i & 7, i >> 3);
        this.grid[i] = piece;
        if (piece) {
            this.players[piece.owner].pieces.push(piece);
        }
    }
    this.updateThreat();
    return this;
}
Board.prototype.draw = function (ctx) {
    ctx.font = "40px sans-serif";

    function cellColor (background, threat) {
        if (threat != 0)
            return "rgb(255,"+(255-threat * 48)+","+(255-threat*48)+")";
            // return "rgb("+((255 - threat * 32)|0)+",0,0)";
        if (background)
            return "rgb(255,255,255)";
        return "rgb(0,0,0)";
    }


    var colors = ["rgb(255,255,255)","rgb(0,0,0)"];
    for (var i = 0; i < 64; ++i) {
        // Cell position (grid)
        var x = i & 7;
        var y = i >> 3;

        // Cell position (pixels)
        var cx = BX + CW * x;
        var cy = BY + CH * y;

        ctx.fillStyle = cellColor((i+y)%2, this.players[PLAYER_1].threat[i]);
        ctx.fillRect (cx, cy, CW, CH);

        if (this.grid[i]) {
            ctx.fillStyle = colors[(i+y)%2];
            ctx.fillText (this.grid[i].getUnicodeSymbol(), cx + 10, cy + 40);
        }
    }
}
var cb = new Board().setupInitial();

function init () {
    var canvas = document.getElementById("canvas");
    var ctx    = canvas.getContext('2d');
    if (!canvas || !ctx)
        window.alert("Could not get canvas / 2d context");

    redraw();
    // cb.updateThreat();
    // cb.draw(ctx);

    canvas.addEventListener("mousedown", onMouseDown, false);

    function onMouseDown (evt) {
        xy = cb.getIndexPos(canvas, evt);

        // ...

        redraw();
    }

    function redraw () {
        cb.updateThreat();
        cb.draw(ctx);
    }
}

// var prevXY = 0;
// var prevPiece = 'R';

// function onMouseDown (evt) {
//     xy = getBoardPos(document.getElementById("canvas"), evt);
//     // if (prevXY >= 0)
//          // cb[xy] = prevPiece;
//     // if (xy >= 0)
//           // prevPiece = cb[xy];
//     // prevXY = xy;

//     // if (cb[xy] == ' ')
//     //     cb[xy] = 'P';
//     // else
//     //     cb[xy] = ' ';

//     // draw();

//     // window.alert("Mousedown: "+xy+" prevPiece: "+prevPiece+" cp:"+cb[xy]);
// }

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

// function draw () {
//     updateThreat();

//     var canvas = document.getElementById('canvas');
//     var ctx = canvas.getContext('2d');
//     // window.alert(ctx.font)
//     ctx.font = "40px sans-serif";

//     if (!canvas || !ctx)
//         window.alert("No canvas support");

    

//     // threat[10] = 1;
//     // threat[12] = 4;
//     // threat[16] = 3;

//     function cellColor (background, threat) {
//         if (threat != 0)
//             return "rgb(255,"+(255-threat * 48)+","+(255-threat*48)+")";
//             // return "rgb("+((255 - threat * 32)|0)+",0,0)";
//         if (background)
//             return "rgb(255,255,255)";
//         return "rgb(0,0,0)";
//     }

//     colors = ["rgb(255,255,255)","rgb(0,0,0)"]
//     for (var i = 0; i < 64; ++i) {
//         x = i & 7;
//         y = i >> 3;

//         // var background = colors[(i+y)%2];
//         // ctx.fillStyle = background;

//         ctx.fillStyle = cellColor((i+y)%2, threat[i]);
//         ctx.fillRect (bx + x * cw, by + y * ch, cw, ch);

//         ctx.fillStyle = colors[(i+y)%2];
//         ctx.fillText (cb[i],//getUnicodeSymbol(cb[i]),
//             bx + x * cw + 10, by + y * ch + 40);
//     }

// }





