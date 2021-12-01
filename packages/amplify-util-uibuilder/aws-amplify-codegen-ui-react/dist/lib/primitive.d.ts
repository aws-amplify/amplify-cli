import { TypeParameterDeclaration, TypeNode } from 'typescript';
declare enum Primitive {
    Alert = "Alert",
    Badge = "Badge",
    Button = "Button",
    ButtonGroup = "ButtonGroup",
    Card = "Card",
    CheckboxField = "CheckboxField",
    Collection = "Collection",
    Divider = "Divider",
    Flex = "Flex",
    Grid = "Grid",
    Heading = "Heading",
    Icon = "Icon",
    Image = "Image",
    Link = "Link",
    Loader = "Loader",
    Pagination = "Pagination",
    PasswordField = "PasswordField",
    PhoneNumberField = "PhoneNumberField",
    Placeholder = "Placeholder",
    Radio = "Radio",
    RadioGroupField = "RadioGroupField",
    Rating = "Rating",
    ScrollView = "ScrollView",
    SearchField = "SearchField",
    SelectField = "SelectField",
    SliderField = "SliderField",
    StepperField = "StepperField",
    SwitchField = "SwitchField",
    Tabs = "Tabs",
    TabItem = "TabItem",
    Text = "Text",
    TextField = "TextField",
    ToggleButton = "ToggleButton",
    ToggleButtonGroup = "ToggleButtonGroup",
    View = "View",
    VisuallyHidden = "VisuallyHidden"
}
export default Primitive;
export declare function isPrimitive(componentType: string): boolean;
export declare const PrimitiveChildrenPropMapping: Partial<Record<Primitive, string>>;
export declare const PrimitiveTypeParameter: Partial<Record<Primitive, {
    declaration: () => TypeParameterDeclaration[] | undefined;
    reference: () => TypeNode[];
}>>;
export declare function isBuiltInIcon(componentType: string): boolean;
