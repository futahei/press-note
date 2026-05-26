"use client";

import Link from "next/link";
import { BookOpenText, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { TermEntry } from "@/lib/data";
import { tagVocabulary } from "@/lib/sample-data";

type WordForm = {
  word: string;
  reading: string;
  meaning: string;
  tags: string[];
};

const emptyForm: WordForm = {
  word: "",
  reading: "",
  meaning: "",
  tags: []
};

export function AdminWordsClient({ initialWords }: { initialWords: TermEntry[] }) {
  const [words, setWords] = useState<TermEntry[]>(initialWords);
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [form, setForm] = useState<WordForm>(emptyForm);

  const selectedLimitReached = form.tags.length >= 3;

  function startCreate() {
    setEditingWord(null);
    setForm(emptyForm);
  }

  function startEdit(word: TermEntry) {
    setEditingWord(word.word);
    setForm({
      word: word.word,
      reading: word.reading ?? "",
      meaning: word.meaning,
      tags: word.tags.slice(0, 3)
    });
  }

  function toggleTag(tag: string) {
    setForm((current) => {
      if (current.tags.includes(tag)) {
        return { ...current, tags: current.tags.filter((item) => item !== tag) };
      }
      if (current.tags.length >= 3) {
        return current;
      }
      return { ...current, tags: [...current.tags, tag] };
    });
  }

  function saveWord() {
    const word = form.word.trim();
    const meaning = form.meaning.trim();
    if (!word || !meaning || form.tags.length === 0) {
      return;
    }

    const nextWord: TermEntry = {
      word,
      reading: form.reading.trim() || undefined,
      meaning,
      tags: form.tags,
      count: editingWord ? words.find((item) => item.word === editingWord)?.count ?? 0 : 0,
      articles: editingWord ? words.find((item) => item.word === editingWord)?.articles ?? [] : []
    };

    setWords((current) => {
      const duplicate = current.some((item) => item.word === word && item.word !== editingWord);
      if (duplicate) {
        return current;
      }
      if (editingWord) {
        return current.map((item) => (item.word === editingWord ? nextWord : item));
      }
      return [nextWord, ...current];
    });
    setEditingWord(null);
    setForm(emptyForm);
  }

  function deleteWord(word: string) {
    setWords((current) => current.filter((item) => item.word !== word));
    if (editingWord === word) {
      setEditingWord(null);
      setForm(emptyForm);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>単語帳管理</h1>
          <p className="muted">AI が登録した単語の追加、編集、削除を管理します。</p>
        </div>
        <button className="button primary" type="button" onClick={startCreate}>
          <Plus size={17} /> 単語を追加
        </button>
      </div>

      <section className="admin-panel form-grid">
        <div className="panel-title">
          <span>{editingWord ? "単語を編集" : "新規単語"}</span>
          <BookOpenText size={18} aria-hidden />
        </div>
        <div className="admin-stat-grid">
          <label className="field admin-stat">
            <span>単語</span>
            <input value={form.word} onChange={(event) => setForm((current) => ({ ...current, word: event.target.value }))} placeholder="例: MLOps" />
          </label>
          <label className="field admin-stat">
            <span>読み</span>
            <input value={form.reading} onChange={(event) => setForm((current) => ({ ...current, reading: event.target.value }))} placeholder="例: エムエルオプス" />
          </label>
        </div>
        <label className="field">
          <span>意味</span>
          <textarea
            rows={3}
            value={form.meaning}
            onChange={(event) => setForm((current) => ({ ...current, meaning: event.target.value }))}
            placeholder="記事の文脈に依存しない、独立した意味を入力"
          />
        </label>
        <fieldset className="field">
          <legend>タグ</legend>
          <div className="tag-multiselect" aria-describedby="word-tag-help">
            {tagVocabulary.map((tag) => {
              const checked = form.tags.includes(tag);
              const disabled = !checked && selectedLimitReached;
              return (
                <label className={checked ? "tag-option selected" : "tag-option"} key={tag}>
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleTag(tag)} />
                  <span>{tag}</span>
                </label>
              );
            })}
          </div>
          <small id="word-tag-help" className="muted">
            固定タグ辞書から最大3件まで選択
          </small>
        </fieldset>
        <div className="segment-row">
          <button className="button primary" type="button" onClick={saveWord}>
            <Check size={17} /> {editingWord ? "更新" : "登録"}
          </button>
          {editingWord ? (
            <button className="button" type="button" onClick={startCreate}>
              <X size={17} /> キャンセル
            </button>
          ) : null}
        </div>
      </section>

      <section className="admin-panel">
        <table className="table">
          <thead>
            <tr>
              <th>単語</th>
              <th>読み</th>
              <th>タグ</th>
              <th>紐づく記事</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {words.map((word) => (
              <tr key={word.word}>
                <td>
                  <strong>{word.word}</strong>
                  <div className="muted">{word.meaning}</div>
                </td>
                <td>{word.reading ?? "-"}</td>
                <td>{word.tags.join(", ")}</td>
                <td>{word.count}件</td>
                <td>
                  <div className="inline-list">
                    <button className="icon-button" type="button" title="編集" aria-label={`${word.word}を編集`} onClick={() => startEdit(word)}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-button" type="button" title="削除" aria-label={`${word.word}を削除`} onClick={() => deleteWord(word.word)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="segment-row">
          <Link className="button" href="/terms">
            公開ページを確認
          </Link>
        </div>
      </section>
    </>
  );
}
