-- Insert default market templates for hamster racing betting

INSERT INTO market_templates (name, question_template, category, default_duration_minutes) VALUES
('Drinking', 'Will {hamster} drink water in the next {duration} minutes?', 'drinking', 5),
('Wheel Running', 'Will {hamster} run on the wheel in the next {duration} minutes?', 'wheel', 3),
('Sleeping', 'Will {hamster} fall asleep in the next {duration} minutes?', 'sleeping', 10),
('Food Eating', 'Will {hamster} eat food in the next {duration} minutes?', 'eating', 5),
('Grooming', 'Will {hamster} groom itself in the next {duration} minutes?', 'grooming', 7),
('Tunnel Activity', 'Will {hamster} go through a tunnel in the next {duration} minutes?', 'movement', 5),
('First Action', 'What will {hamster} do first: drink water or eat food?', 'choice', 3),
('Activity Level', 'Will {hamster} be more active than usual in the next {duration} minutes?', 'activity', 8);
