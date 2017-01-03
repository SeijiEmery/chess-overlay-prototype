
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
    'k', 'q', 'r', 'b', 'n', 'p',
    'K', 'Q', 'R', 'B', 'N', 'P',
]
Piece.prototype.getAsciiSymbol = function () {
    return this.owner == PLAYER_1 ?
        ASCII_CHESS_PIECES[this.type] :
        ASCII_CHESS_PIECES[this.type + 6];
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

    // Clear threat
    for (var i = 0; i < 64; ++i) {
        this.threat[i] = 0;
    }

    if (board.threatTarget != -1) {
        // Paint threat for a specific piece
        if (board.grid[board.threatTarget] && 
            board.grid[board.threatTarget].owner == this.id)
        {
            paintPiece(board.grid[board.threatTarget]);
        }
    } else {
        // Paint threat for all pieces
        for (var i = this.pieces.length; i --> 0; ) {
            paintPiece(this.pieces[i]);
        }
    }
    function paintPiece (piece) {
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
            paintCell(x, piece.y);
            if (board.hasPieceAt(x, piece.y)) break;
        }
        for (var x = piece.x-1; x >= 0; --x) {
            paintCell(x, piece.y);
            if (board.hasPieceAt(x, piece.y)) break;
        }
        for (var y = piece.y+1; y <= 7; ++y) {
            paintCell(piece.x, y);
            if (board.hasPieceAt(piece.x, y)) break;
        }
        for (var y = piece.y-1; y >= 0; --y) {
            paintCell(piece.x, y);
            if (board.hasPieceAt(piece.x, y)) break;
        }
    }
    function paintBishop (piece) {
        function paintDir (dx, dy) {
            for (var x = piece.x + dx, y = piece.y + dy;
                !(x < 0 || y < 0 || x > 7 || y > 7);
                x += dx, y += dy
            ) {
                paintCell(x, y);
                if (board.hasPieceAt(x, y)) break;
            }
        }
        paintDir(+1,+1);
        paintDir(+1,-1);
        paintDir(-1,+1);
        paintDir(-1,-1);
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
        if (piece.x > 0) paintCell(piece.x-1, piece.y + dir);
        if (piece.x < 7) paintCell(piece.x+1, piece.y + dir);
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
    this.threatTarget = -1;
}
Board.prototype.hasPieceAt = function (x, y) {
    return !!this.grid[(x & 7) + (y << 3)];
}
Board.prototype.screenPointToCellIndex = function (x, y) {
    if (x < BX || x > BX + BW ||
        y < BY || y > BY + BH)
        return -1;

    cx = ((x - BX) / CW)|0;
    cy = ((y - BY) / CH)|0;
    return (cx & 7) | (cy << 3);
}
Board.prototype.cellIndexToScreenRect = function (index) {
    // TBD
    return { x:0,y:0,w:0,h:0 };
}
Board.prototype.updateThreat = function () {
    this.players[PLAYER_1].updateThreat(this);
    this.players[PLAYER_2].updateThreat(this);
    return this;
}

// Clear board state (empty; no pieces)
Board.prototype.clear = function () {
    this.grid.length = 64;
    this.players[PLAYER_1].pieces.length = 0;
    this.players[PLAYER_2].pieces.length = 0;
    for (var i = 0; i < 64; ++i) {
        this.grid[i] = null;
    }
}

// Load board state from a FEN string.
// https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
Board.prototype.loadFEN = function (FEN) {
    assert(this !== undefined);
    this.clear();


    var players = this.players;
    var grid    = this.grid;

    function addPiece (player, type, i) {
        players[player].pieces.push(
            grid[i] = new Piece(player, type, i & 7, i >> 3));
    }
    function parseError (msg, j) {
        window.alert("Error loading FEN\n\t'"+FEN+"' ("+j+"):\n"+msg);
    }

    // Parse piece placement (1st field). Field ends at the 1st space.
    var i = 0, j = 0;
    for (; i < 64; ++i, ++j) {
        switch (FEN[j]) {
            case 'P': addPiece(PLAYER_2, PAWN,   i); break;
            case 'N': addPiece(PLAYER_2, KNIGHT, i); break;
            case 'B': addPiece(PLAYER_2, BISHOP, i); break;
            case 'R': addPiece(PLAYER_2, ROOK,   i); break;
            case 'Q': addPiece(PLAYER_2, QUEEN,  i); break;
            case 'K': addPiece(PLAYER_2, KING,   i); break;

            case 'p': addPiece(PLAYER_1, PAWN,   i); break;
            case 'n': addPiece(PLAYER_1, KNIGHT, i); break;
            case 'b': addPiece(PLAYER_1, BISHOP, i); break;
            case 'r': addPiece(PLAYER_1, ROOK,   i); break;
            case 'q': addPiece(PLAYER_1, QUEEN,  i); break;
            case 'k': addPiece(PLAYER_1, KING,   i); break;

            // End rank. Check that rank is well-formed and has appropriate number of pieces (8).
            case '/': 
                if ((i & 7) != 0) 
                    parseError("Unbalanced rank "+(i>>3)+": "+(i&7), j); 
                --i;
                break;
            
            // Skip forward n places
            case '1': break;
            case '2': ++i; break;
            case '3': i += 2; break;
            case '4': i += 3; break;
            case '5': i += 4; break;
            case '6': i += 5; break;
            case '7': i += 6; break;
            case '8': i += 7; break;
            case '9': i += 8; break;

            // End field.
            case ' ': i = 64; break;

            // Unexpected character(s)
            default: parseError("Unexpected character while parsing 1st field (piece placement): '"+FEN[j]+"'", j);
        }
    }

    // Parse 2nd field (active color)
    switch (FEN[++j]) {
        case 'w': this.activePlayer = PLAYER_1; break;
        case 'b': this.activePlayer = PLAYER_2; break;
        default: parseError("Expected 'b' | 'w' for field 2: active player, not '"+FEN[j]+"'", j);
    }
    if (FEN[++j] != ' ')
        parseError("Expected ' ' after field 2, not '"+FEN[j]+"'", j);
    
    // Skip remaining fields (castling, en passant, etc).

    this.updateThreat();
    return this;
}
Board.prototype.setupInitial = function () {
    // this.loadFEN("rnbqkb1r/1p1ppp2/p4np1/P1p4p/R3P3/5N2/1PPP1PPP/1NBQKB1R b KQkq - 1 2");
    // this.loadFEN("rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2");
    this.loadFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    return this;
}

// Board.prototype.setupInitial = function () {
//     var board = [
//         'R','N','B','K','Q','B','N','R',
//         'P','P','P','P','P','P','P','P',
//         ' ',' ',' ',' ',' ',' ',' ',' ',
//         ' ',' ',' ',' ',' ',' ',' ',' ',
//         ' ',' ',' ',' ',' ',' ',' ',' ',
//         ' ',' ',' ',' ',' ',' ',' ',' ',
//         'p','p','p','p','p','p','p','p',
//         'r','n','b','k','q','b','n','r',
//     ];

//     // Reset board state
//     this.grid.length = 0;
//     this.grid.length = 64;
//     this.players[PLAYER_1].pieces.length = 0;
//     this.players[PLAYER_2].pieces.length = 0;

//     for (var i = 0; i < 64; ++i) {
//         var piece = Piece.fromAscii(board[i], i & 7, i >> 3);
//         this.grid[i] = piece;
//         if (piece) {
//             this.players[piece.owner].pieces.push(piece);
//         }
//     }
//     this.updateThreat();
//     return this;
// }
Board.prototype.draw = function (ctx) {
    ctx.font = "40px sans-serif";

    function cellColor (background, wt, bt) {
        if (wt != 0 || bt != 0)
            return "rgb("+(255-bt*48)+","+(255-wt * 48)+","+(255-wt*48)+")";
            // return "rgb(255,"+(255-wt * 48)+","+(255-wt*48)+")";
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

        ctx.fillStyle = cellColor((i+y)%2, 
            this.players[PLAYER_1].threat[i],
            this.players[PLAYER_2].threat[i]
        );

        if (i == this.threatTarget)
            ctx.fillStyle = "rgb(100,100,255)";

        // if (!this.grid[i])
        // if (!this.hasPieceAt((i&7), (i >> 3)))
            // ctx.fillStyle = "rgb(100,255,100)";

        ctx.fillRect (cx, cy, CW, CH);

        if (this.grid[i]) {
            ctx.fillStyle = colors[(i+y)%2];
            ctx.fillText (this.grid[i].getAsciiSymbol(), cx + 10, cy + 40);
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
    canvas.addEventListener("mousemove", onMouseMove, false);

    var selectedPiece = null;

    function onMouseDown (evt) {
        var rect = canvas.getBoundingClientRect();
        x = evt.clientX - rect.left;
        y = evt.clientY - rect.top;
        var index = cb.screenPointToCellIndex(x, y);

        var newPiece = index < 0 ? null : cb.grid[index];

        cb.grid[index] = selectedPiece;
        if (selectedPiece) {
            selectedPiece.x = index & 7;
            selectedPiece.y = index >> 3;
        }
        selectedPiece = newPiece;
    }

    // Update overlay
    function onMouseMove (evt) {
        var rect = canvas.getBoundingClientRect();
        x = evt.clientX - rect.left;
        y = evt.clientY - rect.top;
        var index = cb.screenPointToCellIndex(x, y);

        if (selectedPiece) {
            cb.threatTarget = -1;

            var piece = cb.grid[index];
            cb.grid[index] = selectedPiece;

            var xx = selectedPiece.x, yy = selectedPiece.y;
            selectedPiece.x = index & 7;
            selectedPiece.y = index >> 3;

            if (piece) {
                piece.x = -10;
                piece.y = -10;
            }

            redraw();

            selectedPiece.x = xx;
            selectedPiece.y = yy;
            cb.grid[index] = piece;

            if (piece) {
                piece.x = index & 7;
                piece.y = index >> 3;
            }


        } else {
            cb.threatTarget = index;
            redraw();
        }

        // // Place (temp) for interactive overlay
        // // var piece = index < 0 ? null : cb.grid[index];
        // var piece = cb.grid[index];  // this is js -- why are we bending over backwards when -1 is undefined? (ie. safe access) 
        // cb.grid[index] = selectedPiece;
        // // var piece = null;
        // // if (selectedPiece && index >= 0) {
        // //     piece = cb.grid[index];
        // //     cb.grid[index] = selectedPiece;
        // // }

        // redraw();

        // // Unplace after drawing
        // cb.grid[index] = piece;
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





