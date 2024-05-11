export const WIDTH = 800;
export const HEIGHT = 520;

// Map container child name to index
export const cMap = {
    hairLower: 0,
    head: 1,
    eyes: 2,
    lips: 3,
    faceAcc: 4,
    boardLower: 5,
    hairUpper: 6,
    brow: 7,
    headAcc: 8,
    player: 9,
    shoes: 10,
    bottom: 11,
    top: 12,
    outfit: 13,
    costume: 14,
    bodyAcc: 15,
    boardUpper: 16,
    usernameTag: 17,
    usernameLabel: 18
}
// Map item type id to container index
export const iMap = {
    0: [cMap.hairUpper, cMap.hairLower],
    1: cMap.top,
    2: cMap.bottom,
    3: cMap.outfit,
    4: cMap.shoes,
    5: [cMap.boardLower, cMap.boardUpper],
    6: cMap.headAcc,
    7: cMap.faceAcc,
    8: cMap.bodyAcc,
    9: cMap.costume,
}