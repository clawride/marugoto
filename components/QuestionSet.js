"use client";
import { useState } from "react";
import { sfx } from "@/lib/sfx";

// Bộ câu hỏi trắc nghiệm làm cùng lúc, nộp một lần (dùng cho bài đọc, bài nghe và đề thi)
// questions: [{q, opts, a, explain?}]; answers/setAnswers có thể điều khiển từ bên ngoài
export default function QuestionSet({ questions, onSubmit, submitted: sub, answers: ext, setAnswers: setExt, numberFrom = 1, hideSubmit = false }) {
  const [own, setOwn] = useState({});
  const [done, setDone] = useState(false);
  const answers = ext || own, setAnswers = setExt || setOwn;
  const submitted = sub ?? done;
  const correct = questions.filter((q, i) => answers[i] === q.a).length;
  const submit = () => {
    setDone(true);
    sfx[correct / questions.length >= 0.6 ? "correct" : "wrong"]();
    onSubmit?.(correct, questions.length);
  };
  return (
    <div className="qset">
      {questions.map((q, i) => (
        <div key={i} className={`qitem ${submitted ? (answers[i] === q.a ? "ok" : "bad") : ""}`}>
          <div className="qq"><b>{numberFrom + i}.</b> <span className={/[぀-ヿ一-鿿]/.test(q.q) ? "jpt" : ""}>{q.q}</span>{q.sub && <small className="qsub jpt">（{q.sub}）</small>}</div>
          <div className="qopts">
            {q.opts.map((o, j) => (
              <label key={j} className={`qopt ${answers[i] === j ? "on" : ""} ${submitted && j === q.a ? "right" : ""} ${submitted && answers[i] === j && j !== q.a ? "wrong" : ""}`}>
                <input type="radio" name={`q${numberFrom}-${i}`} disabled={submitted} checked={answers[i] === j} onChange={() => { setAnswers((a) => ({ ...a, [i]: j })); sfx.click(); }} />
                <span className="ql">{j + 1}</span><span className={/[぀-ヿ一-鿿]/.test(o) ? "jpt" : ""}>{o}</span>
              </label>
            ))}
          </div>
          {submitted && (q.explain || q.hint) && <div className="qexp">{answers[i] === q.a ? "✦ " : "✕ "}{q.explain || q.hint}</div>}
        </div>
      ))}
      {!hideSubmit && !submitted && (
        <div className="btnrow"><button className="gbtn tri" onClick={submit} disabled={Object.keys(answers).length < questions.length}><span className="c" />Nộp bài ({Object.keys(answers).length}/{questions.length})</button></div>
      )}
      {!hideSubmit && submitted && <div className="qscore">Đúng <b>{correct}/{questions.length}</b> ({Math.round((correct / questions.length) * 100)}%)</div>}
    </div>
  );
}
