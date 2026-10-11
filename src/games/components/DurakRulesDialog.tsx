import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const SECTIONS = [
  {
    icon: 'Layers',
    title: 'Правила',
    items: [
      'Колода 36 карт, играют от 2 до 6 человек. Каждому раздают по 6 карт, масть нижней карты колоды — козырь.',
      'Первым заходит игрок с младшим козырем. Атакующий кладёт карту, отбивающийся бьёт её старшей картой той же масти или любым козырем.',
      'Подкидывать можно карты того же достоинства, что уже лежат на столе. За раунд не больше 6 карт и не больше, чем карт у отбивающегося.',
      'Если отбился — «бито», карты уходят, и он ходит следующим. Если не смог — берёт все карты, и ход переходит дальше.',
      'После раунда все добирают карты из колоды до шести. Побеждает тот, кто избавился от карт; последний с картами остаётся в дураках.',
    ],
  },
  {
    icon: 'CornerUpRight',
    title: 'Перевод',
    items: [
      'Пока отбивающийся не побил ни одной карты, он может положить карту того же достоинства и перевести атаку на следующего игрока.',
      'Перевести можно, только если у следующего хватает карт, чтобы отбить все карты на столе.',
    ],
  },
  {
    icon: 'Timer',
    title: 'Время на ход',
    items: [
      'На каждый ход даётся 40 секунд. Таймер виден над столом, последние 10 секунд он краснеет.',
    ],
  },
  {
    icon: 'Zap',
    title: 'Если время вышло',
    items: [
      'Отбивающийся автоматически берёт карты.',
      'Атакующий заходит младшей некозырной картой.',
      'Подкидывающий автоматически говорит «бито».',
      'В журнале под рукой появится пометка, что ход сделан автоматически.',
    ],
  },
  {
    icon: 'UserX',
    title: 'Если игрок пропал',
    items: [
      'После трёх пропусков подряд игрок считается проигравшим, и партия заканчивается.',
      'Любой обычный ход обнуляет счётчик пропусков.',
      'Автоход запускает экран любого игрока, у которого открыта партия. Если ни у кого она не открыта, партия ждёт и продолжится, когда кто-то зайдёт.',
    ],
  },
];

export default function DurakRulesDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="bg-amber-400 hover:bg-amber-500 border-amber-500 text-slate-950 font-semibold hover:text-slate-950 disabled:opacity-70"
      >
        <Icon name="BookOpen" size={14} className="mr-1.5" />
        Порядок игры
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-700 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Порядок игры</DialogTitle>
            <DialogDescription className="text-slate-400">Переводной подкидной дурак, 36 карт</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-400">
                  <Icon name={section.icon} size={16} />
                  {section.title}
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
