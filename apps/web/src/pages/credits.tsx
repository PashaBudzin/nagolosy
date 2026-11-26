import { useNavigate } from "react-router-dom"
import { RiArrowLeftLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { CREDIT_SECTIONS } from "@/lib/credits"

export function Credits() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/")}
          aria-label="На головну"
        >
          <RiArrowLeftLine />
        </Button>
        <h1 className="text-2xl font-bold">Подяки та джерела</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Проєкт «Наголоси НМТ» — некомерційний навчальний застосунок. Усі
        матеріали й інструменти, які ми використали, зазначено нижче. Права на
        матеріали належать їхнім власникам.
      </p>

      {CREDIT_SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <ul className="divide-y rounded-lg border">
            {section.items.map((item) => (
              <li key={item.name} className="flex flex-col gap-1 p-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {item.url ? (
                    <a
                      className="font-medium underline underline-offset-2"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <span className="font-medium">{item.name}</span>
                  )}
                  {item.license && (
                    <span className="text-xs text-muted-foreground">
                      ·{" "}
                      {item.licenseUrl ? (
                        <a
                          className="underline underline-offset-2"
                          href={item.licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.license}
                        </a>
                      ) : (
                        item.license
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.note && (
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Якщо ви володієте правами на будь-який матеріал і хочете змінити
        зазначення авторства або прибрати його — будь ласка, зв'яжіться з нами.
      </p>
    </div>
  )
}
