"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { AnimatedLogo, LogoLoader } from "@/components/brand/animated-logo";
import { Composer } from "@/components/composer";
import { PageHeader } from "@/components/shell/app-shell";
import { Wordmark } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, NoCredits, SuccessState } from "@/components/ui/states";

/* Витрина дизайн-системы и состояний Lumen Kit — сверка экранов перед сдачей */
export function UiKit() {
  const [text, setText] = useState("");
  return (
    <div className="mx-auto max-w-[1100px] pb-16">
      <PageHeader title="UI-кит" description="Токены, типографика, материал поверхностей, кнопки и все состояния — в одном месте для сверки экранов." />
      <div className="flex flex-col gap-10 px-4 md:px-10">
        <Section title="Бренд">
          <div className="panel flex flex-wrap items-center gap-10 rounded-lg p-8">
            <AnimatedLogo className="size-20" />
            <Wordmark />
            <LogoLoader label="Загрузка" />
          </div>
        </Section>

        <Section title="Типографика">
          <div className="panel flex flex-col gap-3 rounded-lg p-8">
            <div className="t-display">Что смонтируем?</div>
            <div className="t-title">Заголовок страницы</div>
            <div className="t-heading">Заголовок раздела</div>
            <p className="t-body max-w-[60ch]">Основной текст: объясняет, что происходит и что делать дальше. Длина строки — до 60–70 знаков.</p>
            <div className="t-meta">Метаданные · 12 минут назад</div>
            <div className="t-num text-[15px]">00:00:06:02 · 240 / 600 кр.</div>
          </div>
        </Section>

        <Section title="Материал поверхностей">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="panel rounded-lg p-6 text-[14px]">panel — обычная</div>
            <div className="panel-raised rounded-lg p-6 text-[14px]">panel-raised — плавающая</div>
            <div className="panel-stage rounded-lg p-6 text-[14px]">panel-stage — сцена</div>
          </div>
        </Section>

        <Section title="Кнопки">
          <div className="panel flex flex-wrap items-center gap-3 rounded-lg p-6">
            <Button variant="primary">Главное действие</Button>
            <Button>Вторичное</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Удалить</Button>
            <Button variant="primary" cost={12}>
              Смонтировать
            </Button>
          </div>
        </Section>

        <Section title="Поле промпта">
          <Composer
            value={text}
            onChange={setText}
            attached={[]}
            onAttach={() => {}}
            onDetach={() => {}}
            onSubmit={() => setText("")}
            cost={12}
            placeholder="Начните печатать — кнопка отправки «оживёт»"
            chips={[{ label: "Субтитры и зумы", text: "Субтитры и зумы", onClick: () => setText("Субтитры и зумы") }]}
          />
          <div className="mt-4">
            <Composer value="Сгенерируй вставку с AI-картинкой" onChange={() => {}} attached={[]} onAttach={() => {}} onDetach={() => {}} onSubmit={() => {}} cost={8} balance={3} placeholder="" allowVideo={false} />
          </div>
        </Section>

        <Section title="Состояния">
          <div className="grid gap-4">
            <EmptyState icon={Inbox} title="Здесь появятся ваши проекты" text="Прикрепите первый ролик — Claude смонтирует его меньше чем за минуту." action={<Button variant="primary">Новый шортс</Button>} />
            <ErrorState title="Не получилось сгенерировать" text="Модель не справилась за 3 попытки. Упростите описание или попробуйте ещё раз." refunded={8} onRetry={() => {}} />
            <NoCredits need={12} balance={3} />
            <SuccessState title="Ролик готов" text="1080×1920, 30 к/с · сохранён в проекте" />
            <div className="panel grid grid-cols-3 gap-3 rounded-lg p-6">
              <div className="skeleton aspect-[9/16] rounded-md" />
              <div className="skeleton aspect-[9/16] rounded-md" />
              <div className="skeleton aspect-[9/16] rounded-md" />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="t-heading mb-3">{title}</h2>
      {children}
    </section>
  );
}
