function MySample() {
    this.num = 0;
}

MySample.prototype.plus = function() {
    return this.num + 1;
};

MySample.prototype.minus = function() {
    return this.num - 1;
};