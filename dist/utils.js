"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitPromise = void 0;
/**
 * Limits a promise to a given time frame
 * @param func the function you want to limit
 * @param maxTime how much time the function should take at most to resolve in milliseconds
 */
function limitPromise(func, maxTime) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.race([func(), _timeout(maxTime)]);
    });
}
exports.limitPromise = limitPromise;
function _timeout(maxTime) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            setTimeout(() => {
                resolve(new Error('Could not push .nupkg to GitHub registry. A timeout occured.'));
            }, maxTime);
        }));
    });
}
