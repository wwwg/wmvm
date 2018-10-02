#include <stdio.h>

int doubleValue(int value) {
	return value * 2;
}
int tripleValue(int value) {
    return value + doubleValue(value);
}
int __pow(int x, int n) {
    int ret = 1;
    for (int i = 0; i < n; ++i) {
        ret *= x;
    }
    return ret;
}
int main() {
    printf("woooooo\n");
	int loopVal;
	while (1) {
		loopVal += 2;
		if (loopVal < 40) {
			break;
		}
	}
    printf("loopVal: %d\n", loopVal);
    int two = 2;
    int doubledTwo = doubleValue(two);
    printf("doubled two: %d", doubledTwo);
    int powTwo = __pow(two, two);
    printf("pow(two, two): %d", doubledTwo);
    int tripleTwo = tripleValue(two);
    printf("tripled two: %d", doubledTwo);

	return 0;
}