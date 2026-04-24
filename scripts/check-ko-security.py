#!/usr/bin/env python3
"""한국어 우선 전환과 보안 하드닝 상태를 점검하는 경량 감사 도구."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THIS_FILE = Path(__file__).resolve().relative_to(ROOT)

DEFAULT_TARGETS = [
    "SKILL.md",
    "README.md",
    "README.en.md",
    "LICENSE",
    "test-prompts.json",
    "scripts",
    "assets",
    "references",
    "demos",
]

TEXT_SUFFIXES = {
    "",
    ".css",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".py",
    ".sh",
    ".svg",
    ".txt",
}

EXCLUDED_PARTS = {".git", "node_modules", "screenshots"}
EXCLUDED_FILES = {THIS_FILE.as_posix()}

HAN_RE = re.compile(r"[\u4e00-\u9fff]")
REMOTE_RE = re.compile(r"(?:https?:)?//([^\s\"'<>`]+)")
RISKY_PATTERNS = {
    "innerHTML": re.compile(r"\binnerHTML\b"),
    "insertAdjacentHTML": re.compile(r"\binsertAdjacentHTML\b"),
    "child_process": re.compile(r"\bchild_process\b"),
    "spawnSync": re.compile(r"\bspawnSync\b"),
    "exec": re.compile(r"\bexec(?:File|Sync)?\b"),
    "eval": re.compile(r"\beval\s*\("),
    "new Function": re.compile(r"new\s+Function\b"),
}

SMOKE_CHECKS = [
    {
        "name": "verify 도움말",
        "cmd": [sys.executable, "scripts/verify.py", "--help"],
        "expect_exit": 0,
        "must_contain": ["usage:"],
    },
    {
        "name": "render-video 도움말",
        "cmd": ["node", "scripts/render-video.js", "--help"],
        "expect_exit": 0,
        "must_contain": ["사용법", "render-video.js"],
    },
    {
        "name": "PDF 내보내기 문법",
        "cmd": ["node", "--check", "scripts/export_deck_pdf.mjs"],
        "expect_exit": 0,
        "must_contain": [],
    },
    {
        "name": "deck-stage PDF 내보내기 문법",
        "cmd": ["node", "--check", "scripts/export_deck_stage_pdf.mjs"],
        "expect_exit": 0,
        "must_contain": [],
    },
    {
        "name": "PPTX 내보내기 문법",
        "cmd": ["node", "--check", "scripts/export_deck_pptx.mjs"],
        "expect_exit": 0,
        "must_contain": [],
    },
]


@dataclass
class Hit:
    file: str
    line: int
    kind: str
    snippet: str


@dataclass
class SmokeResult:
    name: str
    command: str
    exit_code: int
    ok: bool
    output: str


def is_text_file(path: Path) -> bool:
    if path.is_dir():
        return False
    rel = path.resolve().relative_to(ROOT).as_posix()
    if rel in EXCLUDED_FILES:
        return False
    if any(part in EXCLUDED_PARTS for part in path.parts):
        return False
    return path.suffix in TEXT_SUFFIXES


def iter_files(paths: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        path = (ROOT / raw).resolve()
        if not path.exists():
            continue
        if path.is_file() and is_text_file(path):
            files.append(path)
        elif path.is_dir():
            files.extend(p for p in path.rglob("*") if is_text_file(p))
    return sorted(set(files))


def safe_snippet(line: str, width: int = 140) -> str:
    compact = " ".join(line.strip().split())
    return compact[:width]


def scan(paths: list[str], sample_limit: int) -> dict[str, list[Hit]]:
    hits: dict[str, list[Hit]] = {"han": [], "remote": [], "risky": []}
    for path in iter_files(paths):
        rel = path.relative_to(ROOT).as_posix()
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = path.read_text(errors="ignore")
        for lineno, line in enumerate(text.splitlines(), start=1):
            if HAN_RE.search(line):
                hits["han"].append(Hit(rel, lineno, "han", safe_snippet(line)))
            if REMOTE_RE.search(line):
                hits["remote"].append(Hit(rel, lineno, "remote", safe_snippet(line)))
            for name, pattern in RISKY_PATTERNS.items():
                if pattern.search(line):
                    hits["risky"].append(Hit(rel, lineno, name, safe_snippet(line)))
    if sample_limit >= 0:
        return {key: value[:sample_limit] for key, value in hits.items()}
    return hits


def count_hits(paths: list[str]) -> dict[str, int]:
    counts = {"han": 0, "remote": 0, "risky": 0}
    for path in iter_files(paths):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = path.read_text(errors="ignore")
        for line in text.splitlines():
            if HAN_RE.search(line):
                counts["han"] += 1
            if REMOTE_RE.search(line):
                counts["remote"] += 1
            if any(pattern.search(line) for pattern in RISKY_PATTERNS.values()):
                counts["risky"] += 1
    return counts


def run_smoke_checks() -> list[SmokeResult]:
    results: list[SmokeResult] = []
    for check in SMOKE_CHECKS:
        proc = subprocess.run(
            check["cmd"],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=20,
            check=False,
        )
        output = proc.stdout.strip()
        ok = proc.returncode == check["expect_exit"] and all(
            needle in output for needle in check["must_contain"]
        )
        results.append(
            SmokeResult(
                name=check["name"],
                command=" ".join(check["cmd"]),
                exit_code=proc.returncode,
                ok=ok,
                output=output[:1000],
            )
        )
    return results


def print_human(counts: dict[str, int], hits: dict[str, list[Hit]], smoke: list[SmokeResult]) -> None:
    print("한국어 우선 전환 / 보안 하드닝 점검")
    print("=" * 44)
    print(f"한자/CJK 잔여 라인: {counts['han']}")
    print(f"외부 URL 라인: {counts['remote']}")
    print(f"위험 API 라인: {counts['risky']}")
    print("")
    for key, label in (("han", "한자/CJK 샘플"), ("remote", "외부 URL 샘플"), ("risky", "위험 API 샘플")):
        print(label)
        if not hits[key]:
            print("  - 없음")
        for hit in hits[key]:
            print(f"  - {hit.file}:{hit.line} [{hit.kind}] {hit.snippet}")
        print("")
    if smoke:
        print("스모크 체크")
        for result in smoke:
            mark = "PASS" if result.ok else "FAIL"
            print(f"  - {mark}: {result.name} ({result.command}) exit={result.exit_code}")
            if not result.ok and result.output:
                print("    " + result.output.replace("\n", "\n    ")[:1000])


def main() -> int:
    parser = argparse.ArgumentParser(
        description="한국어 우선 전환 잔여물, 외부 URL, 위험 API, 스크립트 스모크 체크를 실행합니다."
    )
    parser.add_argument("paths", nargs="*", default=DEFAULT_TARGETS, help="점검할 파일/디렉터리")
    parser.add_argument("--json", action="store_true", help="결과를 JSON으로 출력")
    parser.add_argument("--strict", action="store_true", help="잔여물/외부 URL/위험 API 발견 시 실패 처리")
    parser.add_argument("--no-smoke", action="store_true", help="스크립트 스모크 체크를 건너뜀")
    parser.add_argument("--sample-limit", type=int, default=10, help="종류별 샘플 출력 개수(-1은 전체)")
    args = parser.parse_args()

    counts = count_hits(args.paths)
    hits = scan(args.paths, args.sample_limit)
    smoke = [] if args.no_smoke else run_smoke_checks()
    smoke_failed = any(not item.ok for item in smoke)
    strict_failed = args.strict and any(counts.values())

    if args.json:
        print(json.dumps({
            "counts": counts,
            "samples": {key: [asdict(hit) for hit in value] for key, value in hits.items()},
            "smoke": [asdict(result) for result in smoke],
            "ok": not smoke_failed and not strict_failed,
        }, ensure_ascii=False, indent=2))
    else:
        print_human(counts, hits, smoke)

    return 1 if smoke_failed or strict_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
