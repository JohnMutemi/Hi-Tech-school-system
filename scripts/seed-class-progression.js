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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// Example usage: node scripts/seed-class-progression.ts <schoolId>
var schoolId = process.argv[2];
if (!schoolId) {
    console.error('Usage: node scripts/seed-class-progression.ts <schoolId>');
    process.exit(1);
}
// List your class names in order here:
var classNames = [
    'Grade 1A',
    'Grade 2A',
    'Grade 3A',
    'Grade 4A',
    'Grade 5A',
    'Grade 6A',
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var i, fromClass, toClass, exists;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < classNames.length - 1)) return [3 /*break*/, 6];
                    fromClass = classNames[i];
                    toClass = classNames[i + 1];
                    return [4 /*yield*/, prisma.classProgression.findFirst({
                            where: { schoolId: schoolId, fromClass: fromClass, isActive: true },
                        })];
                case 2:
                    exists = _a.sent();
                    if (!!exists) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma.classProgression.create({
                            data: {
                                schoolId: schoolId,
                                fromClass: fromClass,
                                toClass: toClass,
                                order: i + 1,
                                isActive: true,
                                fromGrade: fromClass.split(' ')[0],
                                toGrade: toClass.split(' ')[0],
                                fromAcademicYear: '2025', // Adjust as needed
                                toAcademicYear: '2026', // Adjust as needed
                            },
                        })];
                case 3:
                    _a.sent();
                    console.log("Created progression: ".concat(fromClass, " -> ").concat(toClass));
                    return [3 /*break*/, 5];
                case 4:
                    console.log("Progression already exists: ".concat(fromClass, " -> ").concat(toClass));
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log('Done!');
                    return [4 /*yield*/, prisma.$disconnect()];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
