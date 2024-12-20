"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
electron_1.contextBridge.exposeInMainWorld('sqlite3', {
    Database: better_sqlite3_1.default
});
