describe("main.js", function() {
    it("test plus funciton", function() {
        const expectResult = 1;
        const fnc = new MySample();
        const plusResult = fnc.plus();
        expect(plusResult).toEqual(expectResult);
    });

    it("test minus funciton", function() {
        const expectResult = -1;
        const fnc = new MySample();
        const plusResult = fnc.minus();
        expect(plusResult).toEqual(expectResult);
    });
});