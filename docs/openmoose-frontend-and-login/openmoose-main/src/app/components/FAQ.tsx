import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const faqs = [
  {
    question: 'Can I customize agents?',
    answer: 'Yes! All agents are fully customizable. You can modify their behavior, integrate with your existing tools, and even create custom agents from scratch using our API.'
  },
  {
    question: 'How does the pricing work?',
    answer: 'Pricing is based on the number of active agents and monthly requests. You only pay for what you use, and you can upgrade or downgrade at any time. All plans include a 14-day free trial.'
  },
  {
    question: 'What is an agent team?',
    answer: 'An agent team is a group of specialized AI agents that work together to accomplish complex tasks. Each agent has a specific role and they collaborate to deliver better results than a single agent could achieve alone.'
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'We offer multiple levels of support based on your plan. Starter includes community support, Pro gets priority email support, Ultra includes dedicated support channels, and Enterprise customers get 24/7 phone support with guaranteed response times.'
  },
  {
    question: 'How do I get started?',
    answer: 'Simply sign up for a free trial, choose your plan, and start building. Our documentation and tutorials will guide you through creating your first agent team. No credit card required for the trial.'
  }
];

export function FAQ() {
  return (
    <section className="py-24 pb-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Common
            <span className="text-gray-400"> questions</span>
          </h2>
          <p className="text-xl text-gray-500">
            Everything you need to know about building with agent teams.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-gray-50 rounded-2xl border border-gray-200 px-8 hover:bg-gray-100 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-lg text-gray-900 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pb-6 text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}